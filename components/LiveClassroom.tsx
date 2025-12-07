
import React, { useEffect, useRef, useState, memo } from 'react';
import { Mic, MicOff, Video, VideoOff, MessageSquare, Users, ScreenShare, Activity, BarChart2, X, HelpCircle, Send } from 'lucide-react';
import { ChatMessage, Role, Poll } from '../types';
import { db, auth } from '../services/firebase';
import { collection, doc, setDoc, onSnapshot, addDoc, updateDoc, deleteDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { getAiAssistance } from '../services/geminiService';

interface LiveClassroomProps {
    role?: Role;
    onLeave?: () => void;
}

// WebRTC Configuration
const iceServers = {
  iceServers: [
    {
      urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'],
    },
  ],
  iceCandidatePoolSize: 10,
};

// --- MEMOIZED VIDEO PLAYER ---
// This prevents the video from reloading/buffering when the parent state (chat typing) changes.
const VideoPlayer = memo(({ stream, isLocal, label, isScreenShare }: { stream: MediaStream | null, isLocal: boolean, label?: string, isScreenShare?: boolean }) => {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
        }
    }, [stream]);

    if (!stream) {
        return (
            <div className="w-full h-full flex items-center justify-center flex-col text-slate-500 animate-pulse bg-black">
                <Activity size={48} className="mb-4 text-slate-700" />
                <p>Waiting for stream...</p>
            </div>
        );
    }

    return (
        <div className="w-full h-full relative bg-black">
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted={isLocal} // Only mute local video to prevent echo
                className={`w-full h-full object-contain ${isLocal && !isScreenShare ? 'transform scale-x-[-1]' : ''}`}
            />
            {label && (
                <div className="absolute top-4 left-4 bg-black/60 px-3 py-1.5 rounded-lg text-sm text-white font-bold flex items-center backdrop-blur-md z-10">
                    <span className="w-2 h-2 rounded-full bg-red-500 mr-2 animate-pulse"></span>
                    {label}
                </div>
            )}
        </div>
    );
});

const LiveClassroom: React.FC<LiveClassroomProps> = ({ role = 'student', onLeave }) => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  // Store remote streams. For Admin, this contains student streams. For Student, it contains 'admin' stream.
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  
  // Chat & Polls
  const [activeTab, setActiveTab] = useState<'chat' | 'polls'>('chat');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [polls, setPolls] = useState<Poll[]>([]);
  const [newPollQuestion, setNewPollQuestion] = useState('');
  const [newPollOptions, setNewPollOptions] = useState(['', '']);

  // AI Doubt Solver
  const [showAiHelp, setShowAiHelp] = useState(false);
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isAiThinking, setIsAiThinking] = useState(false);
  
  // Refs
  const pcsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const unsubscribesRef = useRef<(() => void)[]>([]);

  const ROOM_ID = 'main-class';

  // 1. Initialize Media & Listeners
  useEffect(() => {
    const startLocalStream = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                width: { ideal: 1280 }, 
                height: { ideal: 720 },
                frameRate: { ideal: 30 } 
            }, 
            audio: { 
                echoCancellation: true, 
                noiseSuppression: true,
                autoGainControl: true
            } 
        });
        setLocalStream(stream);
        localStreamRef.current = stream;
        
        if (role === 'admin') {
            await createRoom();
        } else {
            await joinRoom();
        }
      } catch (err) {
        console.error("Error accessing media devices:", err);
        alert("Camera/Mic permission denied. Please allow access to join the class.");
      }
    };
    startLocalStream();

    return () => {
      cleanup();
    };
  }, []);

  // 2. Chat Listener
  useEffect(() => {
     const q = query(collection(db, `rooms/${ROOM_ID}/messages`));
     const unsub = onSnapshot(q, (snapshot) => {
         const msgs: ChatMessage[] = [];
         snapshot.forEach(doc => msgs.push(doc.data() as ChatMessage));
         // Safe Client-side sort handling null timestamps
         msgs.sort((a, b) => {
             const tA = a.timestamp ? (a.timestamp as any).seconds : Date.now()/1000 + 9999;
             const tB = b.timestamp ? (b.timestamp as any).seconds : Date.now()/1000 + 9999;
             return tA - tB;
         });
         setChatMessages(msgs);
     }, (err) => console.error("Chat error:", err));
     return () => unsub();
  }, []);

  // 3. Polls Listener
  useEffect(() => {
      const q = query(collection(db, `rooms/${ROOM_ID}/polls`));
      const unsub = onSnapshot(q, (snapshot) => {
          const fetchedPolls: Poll[] = [];
          snapshot.forEach(doc => fetchedPolls.push({id: doc.id, ...doc.data()} as Poll));
          setPolls(fetchedPolls);
      }, (err) => console.error("Poll error:", err));
      return () => unsub();
  }, []);

  const cleanup = async () => {
      localStreamRef.current?.getTracks().forEach(track => track.stop());
      screenStreamRef.current?.getTracks().forEach(track => track.stop());
      
      pcsRef.current.forEach(pc => pc.close());
      pcsRef.current.clear();
      unsubscribesRef.current.forEach(unsub => unsub());

      if (role === 'student' && auth.currentUser) {
          try {
             await deleteDoc(doc(db, `rooms/${ROOM_ID}/participants`, auth.currentUser.uid));
          } catch(e) { console.log("Cleanup error", e); }
      } else if (role === 'admin') {
          try {
             await updateDoc(doc(db, "rooms", ROOM_ID), { active: false });
          } catch(e) { console.log("Cleanup error", e); }
      }
  };

  // --- ADMIN LOGIC ---
  const createRoom = async () => {
      await setDoc(doc(db, "rooms", ROOM_ID), { active: true, startedAt: serverTimestamp() }, { merge: true });

      const participantsRef = collection(db, `rooms/${ROOM_ID}/participants`);
      const unsub = onSnapshot(participantsRef, (snapshot) => {
          snapshot.docChanges().forEach(async (change) => {
              if (change.type === 'added') {
                  const userId = change.doc.id;
                  await callUser(userId);
              }
          });
      });
      unsubscribesRef.current.push(unsub);
  };

  const callUser = async (userId: string) => {
      if (!localStreamRef.current) return;
      if (pcsRef.current.has(userId)) return; 
      
      const pc = new RTCPeerConnection(iceServers);
      pcsRef.current.set(userId, pc);

      const streamToSend = isScreenSharing && screenStreamRef.current ? screenStreamRef.current : localStreamRef.current;
      
      streamToSend.getTracks().forEach(track => {
          pc.addTrack(track, streamToSend);
      });

      // Admin receives Student Audio/Video
      pc.ontrack = (event) => {
          // Use the stream provided by the event for stability
          const stream = event.streams[0] || new MediaStream();
          if (event.streams.length === 0) {
              stream.addTrack(event.track);
          }
          // Store it in state so we can render an <audio> tag for it
          setRemoteStreams(prev => new Map(prev).set(userId, stream));
      };

      const participantsRef = doc(db, `rooms/${ROOM_ID}/participants`, userId);
      const callerCandidatesCollection = collection(participantsRef, 'callerCandidates');
      
      pc.onicecandidate = (event) => {
          if (event.candidate) {
              addDoc(callerCandidatesCollection, event.candidate.toJSON());
          }
      };

      const offerDescription = await pc.createOffer();
      await pc.setLocalDescription(offerDescription);

      const offer = {
          sdp: offerDescription.sdp,
          type: offerDescription.type,
      };

      await updateDoc(participantsRef, { offer });

      const unsub = onSnapshot(participantsRef, (snapshot) => {
          const data = snapshot.data();
          if (!pc.currentRemoteDescription && data?.answer) {
              const answerDescription = new RTCSessionDescription(data.answer);
              pc.setRemoteDescription(answerDescription);
          }
      });
      unsubscribesRef.current.push(unsub);

      const calleeCandidatesCollection = collection(participantsRef, 'calleeCandidates');
      const unsubCandidates = onSnapshot(calleeCandidatesCollection, (snapshot) => {
          snapshot.docChanges().forEach((change) => {
              if (change.type === 'added') {
                  const data = change.doc.data();
                  const candidate = new RTCIceCandidate(data);
                  
                  // Safety: Ensure remote desc exists before adding candidate
                  if (pc.remoteDescription) {
                      pc.addIceCandidate(candidate).catch(e => console.error("ICE Error", e));
                  } else {
                      // Retry logic if candidate arrives before answer
                      setTimeout(() => {
                          if (pc.remoteDescription) {
                              pc.addIceCandidate(candidate).catch(e => console.error("ICE Error Retry", e));
                          }
                      }, 1500);
                  }
              }
          });
      });
      unsubscribesRef.current.push(unsubCandidates);
  };

  // --- STUDENT LOGIC ---
  const joinRoom = async () => {
      if (!localStreamRef.current || !auth.currentUser) return;
      const userId = auth.currentUser.uid;

      const participantRef = doc(db, `rooms/${ROOM_ID}/participants`, userId);
      // Reset candidates on join
      await setDoc(participantRef, { joined: true });

      const unsub = onSnapshot(participantRef, async (snapshot) => {
          const data = snapshot.data();
          if (data?.offer && !pcsRef.current.has('admin')) {
              const pc = new RTCPeerConnection(iceServers);
              pcsRef.current.set('admin', pc);

              // Add local tracks (Audio/Video)
              localStreamRef.current!.getTracks().forEach(track => {
                  pc.addTrack(track, localStreamRef.current!);
              });

              // Receive Remote Tracks (Admin Video/Audio)
              pc.ontrack = (event) => {
                  const stream = event.streams[0] || new MediaStream();
                  if (event.streams.length === 0) {
                      stream.addTrack(event.track);
                  }
                  // Force state update to trigger re-render of video player
                  setRemoteStreams(prev => new Map(prev).set('admin', stream));
              };

              const calleeCandidatesCollection = collection(participantRef, 'calleeCandidates');
              pc.onicecandidate = (event) => {
                  if (event.candidate) {
                      addDoc(calleeCandidatesCollection, event.candidate.toJSON());
                  }
              };

              const offerDesc = new RTCSessionDescription(data.offer);
              await pc.setRemoteDescription(offerDesc);

              const answerDesc = await pc.createAnswer();
              await pc.setLocalDescription(answerDesc);

              await updateDoc(participantRef, { 
                  answer: { type: answerDesc.type, sdp: answerDesc.sdp } 
              });

              const callerCandidatesCollection = collection(participantRef, 'callerCandidates');
              const unsubCandidates = onSnapshot(callerCandidatesCollection, (snapshot) => {
                  snapshot.docChanges().forEach((change) => {
                      if (change.type === 'added') {
                          const candidateData = change.doc.data();
                          const candidate = new RTCIceCandidate(candidateData);
                          if (pc.remoteDescription) {
                              pc.addIceCandidate(candidate).catch(e => console.error("ICE Error", e));
                          } else {
                              setTimeout(() => {
                                  if (pc.remoteDescription) {
                                      pc.addIceCandidate(candidate).catch(e => console.error("ICE Error Retry", e));
                                  }
                              }, 1500);
                          }
                      }
                  });
              });
              unsubscribesRef.current.push(unsubCandidates);
          }
      });
      unsubscribesRef.current.push(unsub);
  };

  // --- FEATURES ---

  const toggleScreenShare = async () => {
    if (role !== 'admin') return;

    if (!isScreenSharing) {
        try {
            const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
            screenStreamRef.current = stream;
            setIsScreenSharing(true);
            setLocalStream(stream); // Show local preview

            const videoTrack = stream.getVideoTracks()[0];
            const audioTrack = stream.getAudioTracks()[0];

            pcsRef.current.forEach((pc) => {
                const senders = pc.getSenders();
                const videoSender = senders.find((s) => s.track?.kind === 'video');
                if (videoSender) videoSender.replaceTrack(videoTrack);
                
                if (audioTrack) {
                    const audioSender = senders.find((s) => s.track?.kind === 'audio');
                    if (audioSender) audioSender.replaceTrack(audioTrack);
                }
            });

            videoTrack.onended = () => stopScreenShare();

        } catch (err) {
            console.error("Error sharing screen", err);
        }
    } else {
        stopScreenShare();
    }
  };

  const stopScreenShare = () => {
      if (localStreamRef.current) {
          setLocalStream(localStreamRef.current);
          const videoTrack = localStreamRef.current.getVideoTracks()[0];
          pcsRef.current.forEach((pc) => {
              const sender = pc.getSenders().find((s) => s.track?.kind === 'video');
              if (sender) sender.replaceTrack(videoTrack);
          });
      }
      screenStreamRef.current?.getTracks().forEach(t => t.stop());
      screenStreamRef.current = null;
      setIsScreenSharing(false);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newMessage.trim() || !auth.currentUser) return;
      
      const msg: ChatMessage = {
          id: Date.now().toString(),
          sender: 'user',
          senderName: auth.currentUser.displayName || (role === 'admin' ? 'Instructor' : 'Student'),
          text: newMessage,
          timestamp: new Date()
      };
      
      await setDoc(doc(db, `rooms/${ROOM_ID}/messages`, msg.id), {
          ...msg,
          timestamp: serverTimestamp()
      });
      setNewMessage('');
  };

  const createPoll = async () => {
      if (!newPollQuestion || newPollOptions.some(o => !o.trim())) return;
      const options = newPollOptions.map((text, idx) => ({ id: idx, text, votes: 0 }));
      
      await addDoc(collection(db, `rooms/${ROOM_ID}/polls`), {
          question: newPollQuestion,
          options,
          isActive: true,
          createdAt: serverTimestamp()
      });
      setNewPollQuestion('');
      setNewPollOptions(['', '']);
  };

  const votePoll = async (pollId: string, optionId: number) => {
      const pollRef = doc(db, `rooms/${ROOM_ID}/polls`, pollId);
      const poll = polls.find(p => p.id === pollId);
      if (!poll) return;

      const updatedOptions = poll.options.map(opt => {
          if (opt.id === optionId) return { ...opt, votes: opt.votes + 1 };
          return opt;
      });

      await updateDoc(pollRef, { options: updatedOptions });
  };

  const handleAiDoubt = async () => {
      if (!aiQuestion.trim()) return;
      setIsAiThinking(true);
      const ans = await getAiAssistance("We are in a live Python class. Explain briefly.", aiQuestion);
      setAiResponse(ans);
      setIsAiThinking(false);
  };

  return (
    <div className="flex h-full bg-slate-950 overflow-hidden relative">
      
      {/* --- LEFT: STAGE AREA (Host / Screen Share) --- */}
      <div className="flex-1 flex flex-col p-4 relative">
        <div className="flex justify-between items-center mb-4 z-10">
            <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Activity className="text-red-500 animate-pulse" size={20} />
                    Live: Python Masterclass
                </h2>
            </div>
            <div className="flex items-center gap-2">
                 <span className="bg-red-500/20 text-red-500 text-xs font-bold px-2 py-1 rounded border border-red-500/20">LIVE</span>
                 <span className="bg-slate-800 text-slate-400 text-xs font-mono px-2 py-1 rounded flex items-center">
                     <Users size={12} className="mr-1"/> {role === 'admin' ? remoteStreams.size : (remoteStreams.size > 0 ? 'Connected' : 'Connecting...')}
                 </span>
            </div>
        </div>

        {/* Main Stage Video */}
        <div className="flex-1 bg-black rounded-2xl overflow-hidden relative shadow-2xl border border-slate-800">
             {role === 'admin' ? (
                 <VideoPlayer 
                    key={localStream?.id || 'local'}
                    stream={localStream} 
                    isLocal={true} 
                    label="Instructor (You)" 
                    isScreenShare={isScreenSharing} 
                 />
             ) : (
                 <VideoPlayer 
                    key={remoteStreams.get('admin')?.id || 'remote'}
                    stream={remoteStreams.get('admin') || null} 
                    isLocal={false} 
                    label="Instructor" 
                 />
             )}
             
             {/* HIDDEN AUDIO ELEMENTS FOR ADMIN TO HEAR STUDENTS */}
             {role === 'admin' && Array.from(remoteStreams.entries()).map(([id, stream]) => (
                 <audio 
                    key={`audio-${id}`} 
                    autoPlay 
                    ref={ref => { if (ref && ref.srcObject !== stream) ref.srcObject = stream; }} 
                 />
             ))}
        </div>

        {/* Bottom Controls */}
        <div className="mt-4 flex justify-center items-center gap-4">
            <button onClick={() => {
                 if (localStreamRef.current) {
                     localStreamRef.current.getAudioTracks().forEach(t => t.enabled = !isMicOn);
                     setIsMicOn(!isMicOn);
                 }
            }} className={`p-4 rounded-full transition-all ${isMicOn ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-red-500 text-white shadow-lg shadow-red-500/20'}`}>
                {isMicOn ? <Mic size={24} /> : <MicOff size={24} />}
            </button>
            
            <button onClick={() => {
                 if (localStreamRef.current) {
                     localStreamRef.current.getVideoTracks().forEach(t => t.enabled = !isVideoOn);
                     setIsVideoOn(!isVideoOn);
                 }
            }} className={`p-4 rounded-full transition-all ${isVideoOn ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-red-500 text-white shadow-lg shadow-red-500/20'}`}>
                {isVideoOn ? <Video size={24} /> : <VideoOff size={24} />}
            </button>

            {role === 'admin' && (
                <button 
                    onClick={toggleScreenShare} 
                    className={`p-4 rounded-full transition-all ${isScreenSharing ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/30' : 'bg-slate-800 text-white hover:bg-slate-700'}`}
                    title="Share Screen"
                >
                    <ScreenShare size={24} />
                </button>
            )}

            <button onClick={onLeave} className="px-8 py-4 bg-red-600 hover:bg-red-700 text-white rounded-full font-bold ml-4 shadow-lg shadow-red-600/20">
                Leave
            </button>
        </div>
      </div>

      {/* --- RIGHT: SIDEBAR (Chat & Polls) --- */}
      <div className="w-96 bg-slate-900 border-l border-slate-800 flex flex-col z-20 shadow-2xl">
          <div className="flex border-b border-slate-800">
              <button 
                onClick={() => setActiveTab('chat')}
                className={`flex-1 py-4 font-medium text-sm flex items-center justify-center border-b-2 transition-colors ${activeTab === 'chat' ? 'border-primary-500 text-white bg-slate-800/50' : 'border-transparent text-slate-400 hover:bg-slate-800/30'}`}
              >
                  <MessageSquare size={16} className="mr-2" /> Chat
              </button>
              <button 
                onClick={() => setActiveTab('polls')}
                className={`flex-1 py-4 font-medium text-sm flex items-center justify-center border-b-2 transition-colors ${activeTab === 'polls' ? 'border-primary-500 text-white bg-slate-800/50' : 'border-transparent text-slate-400 hover:bg-slate-800/30'}`}
              >
                  <BarChart2 size={16} className="mr-2" /> Polls
              </button>
          </div>

          {activeTab === 'chat' ? (
              <>
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {chatMessages.map(msg => (
                        <div key={msg.id} className={`flex flex-col ${msg.senderName.includes(auth.currentUser?.displayName || 'x') ? 'items-end' : 'items-start'}`}>
                            <div className="flex items-baseline mb-1">
                                <span className={`text-xs font-bold ${msg.senderName === 'Instructor' ? 'text-red-400' : 'text-slate-500'}`}>{msg.senderName}</span>
                            </div>
                            <div className={`px-4 py-2 rounded-2xl text-sm max-w-[90%] ${msg.senderName.includes(auth.currentUser?.displayName || 'x') ? 'bg-primary-600 text-white rounded-tr-none' : 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700'}`}>
                                {msg.text}
                            </div>
                        </div>
                    ))}
                </div>
                <form onSubmit={handleSendMessage} className="p-4 bg-slate-950 border-t border-slate-800">
                    <div className="relative">
                        <input 
                            type="text" 
                            value={newMessage}
                            onChange={e => setNewMessage(e.target.value)}
                            placeholder="Type a message..."
                            className="w-full bg-slate-900 border border-slate-700 rounded-full pl-5 pr-12 py-3 text-white text-sm focus:outline-none focus:border-primary-500"
                        />
                        <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-primary-600 rounded-full text-white hover:bg-primary-500">
                            <Send size={16} />
                        </button>
                    </div>
                </form>
              </>
          ) : (
              <div className="flex-1 flex flex-col p-4 overflow-y-auto">
                  {role === 'admin' && (
                      <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 mb-6">
                          <h3 className="text-white font-bold text-sm mb-3">Create Poll</h3>
                          <input 
                            className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white mb-2"
                            placeholder="Poll Question"
                            value={newPollQuestion}
                            onChange={e => setNewPollQuestion(e.target.value)}
                          />
                          {newPollOptions.map((opt, idx) => (
                              <input 
                                key={idx}
                                className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white mb-2"
                                placeholder={`Option ${idx + 1}`}
                                value={opt}
                                onChange={e => {
                                    const newOpts = [...newPollOptions];
                                    newOpts[idx] = e.target.value;
                                    setNewPollOptions(newOpts);
                                }}
                              />
                          ))}
                          <div className="flex gap-2 mt-2">
                             <button onClick={() => setNewPollOptions([...newPollOptions, ''])} className="text-xs bg-slate-700 text-slate-300 px-3 py-1 rounded hover:bg-slate-600">+ Option</button>
                             <button onClick={createPoll} className="text-xs bg-primary-600 text-white px-3 py-1 rounded hover:bg-primary-500 ml-auto font-bold">Launch Poll</button>
                          </div>
                      </div>
                  )}

                  <div className="space-y-4">
                      {polls.map(poll => (
                          <div key={poll.id} className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                              <h3 className="text-white font-bold mb-3">{poll.question}</h3>
                              <div className="space-y-2">
                                  {poll.options.map(opt => {
                                      const totalVotes = poll.options.reduce((acc, curr) => acc + curr.votes, 0);
                                      const percent = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;
                                      
                                      return (
                                        <button 
                                            key={opt.id}
                                            onClick={() => votePoll(poll.id, opt.id)}
                                            className="w-full relative h-10 bg-slate-900 rounded-lg overflow-hidden text-left group"
                                        >
                                            <div className="absolute top-0 left-0 h-full bg-primary-500/20 transition-all duration-500" style={{ width: `${percent}%` }}></div>
                                            <div className="absolute inset-0 flex items-center justify-between px-4 z-10">
                                                <span className="text-sm text-slate-200">{opt.text}</span>
                                                <span className="text-xs font-bold text-primary-400">{percent}%</span>
                                            </div>
                                        </button>
                                      );
                                  })}
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          )}
      </div>

      {/* --- AI DOUBT SOLVER --- */}
      <div className="absolute bottom-6 left-6 z-50">
          {!showAiHelp ? (
              <button 
                onClick={() => setShowAiHelp(true)}
                className="bg-purple-600 hover:bg-purple-500 text-white p-4 rounded-full shadow-2xl shadow-purple-600/30 transition-transform hover:scale-110 flex items-center gap-2 font-bold"
              >
                  <HelpCircle size={24} />
                  <span className="hidden md:inline">Ask AI Doubt</span>
              </button>
          ) : (
              <div className="bg-slate-900 border border-slate-700 w-80 rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-5">
                  <div className="bg-purple-600 p-4 flex justify-between items-center">
                      <h3 className="font-bold text-white flex items-center"><HelpCircle size={18} className="mr-2"/> AI Assistant</h3>
                      <button onClick={() => setShowAiHelp(false)} className="text-white/80 hover:text-white"><X size={18}/></button>
                  </div>
                  <div className="p-4 max-h-60 overflow-y-auto bg-slate-950 min-h-[150px]">
                      {aiResponse ? (
                          <div className="text-sm text-slate-200 whitespace-pre-wrap">{aiResponse}</div>
                      ) : (
                          <p className="text-xs text-slate-500 text-center mt-4">Ask a question about the class topic privately.</p>
                      )}
                  </div>
                  <div className="p-3 border-t border-slate-800 bg-slate-900">
                       <div className="flex gap-2">
                           <input 
                            className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                            placeholder="Type doubt..."
                            value={aiQuestion}
                            onChange={e => setAiQuestion(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleAiDoubt()}
                           />
                           <button onClick={handleAiDoubt} disabled={isAiThinking} className="bg-purple-600 text-white p-2 rounded-lg">
                               {isAiThinking ? '...' : <Send size={16}/>}
                           </button>
                       </div>
                  </div>
              </div>
          )}
      </div>

    </div>
  );
};

export default LiveClassroom;
