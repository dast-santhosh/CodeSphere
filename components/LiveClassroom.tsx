
import React, { useEffect, useRef, useState, memo } from 'react';
import { Mic, MicOff, Video, VideoOff, MessageSquare, Users, ScreenShare, Activity, BarChart2, X, HelpCircle, Send, MoreVertical, Layout, Settings } from 'lucide-react';
import { ChatMessage, Role, Poll } from '../types';
import { db, auth } from '../services/firebase';
import { collection, doc, setDoc, onSnapshot, addDoc, updateDoc, deleteDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { getAiAssistance } from '../services/geminiService';

interface LiveClassroomProps {
    role?: Role;
    onLeave?: () => void;
}

const iceServers = {
  iceServers: [
    { urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'] },
  ],
  iceCandidatePoolSize: 10,
};

const VideoPlayer = memo(({ stream, isLocal, label, isScreenShare }: { stream: MediaStream | null, isLocal: boolean, label?: string, isScreenShare?: boolean }) => {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
        }
    }, [stream]);

    if (!stream) {
        return (
            <div className="w-full h-full flex items-center justify-center flex-col text-neutral-400 bg-neutral-900">
                <div className="w-16 h-16 bg-neutral-800 flex items-center justify-center mb-4">
                    <Activity size={32} className="text-neutral-500" />
                </div>
                <p className="text-sm font-medium">Waiting for stream...</p>
            </div>
        );
    }

    return (
        <div className="w-full h-full relative bg-black overflow-hidden group">
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted={isLocal} 
                className={`w-full h-full object-contain bg-neutral-900 ${isLocal && !isScreenShare ? 'transform scale-x-[-1]' : ''}`}
            />
            <div className="absolute bottom-4 left-4 px-3 py-1 bg-black/60 backdrop-blur-sm text-xs text-white font-medium z-10">
                {label} {isLocal && "(You)"}
            </div>
        </div>
    );
});

const LiveClassroom: React.FC<LiveClassroomProps> = ({ role = 'student', onLeave }) => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const isScreenSharingRef = useRef(false);
  
  const [activeTab, setActiveTab] = useState<'chat' | 'polls'>('chat');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [polls, setPolls] = useState<Poll[]>([]);
  const [newPollQuestion, setNewPollQuestion] = useState('');
  const [newPollOptions, setNewPollOptions] = useState(['', '']);

  const [showAiHelp, setShowAiHelp] = useState(false);
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isAiThinking, setIsAiThinking] = useState(false);
  
  const pcsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const unsubscribesRef = useRef<(() => void)[]>([]);

  const ROOM_ID = 'main-class';

  useEffect(() => {
    const startLocalStream = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { width: { ideal: 1280 }, height: { ideal: 720 } }, 
            audio: { echoCancellation: true, noiseSuppression: true } 
        });
        setLocalStream(stream);
        localStreamRef.current = stream;
        
        if (role === 'admin') await createRoom();
        else await joinRoom();
      } catch (err) {
        console.error("Error accessing media devices:", err);
      }
    };
    startLocalStream();
    return () => { cleanup(); };
  }, []);

  useEffect(() => {
     const q = query(collection(db, `rooms/${ROOM_ID}/messages`));
     const unsub = onSnapshot(q, (snapshot) => {
         const msgs: ChatMessage[] = [];
         snapshot.forEach(doc => msgs.push(doc.data() as ChatMessage));
         msgs.sort((a, b) => {
             const tA = a.timestamp ? (a.timestamp as any).seconds : Date.now()/1000;
             const tB = b.timestamp ? (b.timestamp as any).seconds : Date.now()/1000;
             return tA - tB;
         });
         setChatMessages(msgs);
     });
     return () => unsub();
  }, []);

  useEffect(() => {
      const q = query(collection(db, `rooms/${ROOM_ID}/polls`));
      const unsub = onSnapshot(q, (snapshot) => {
          const fetchedPolls: Poll[] = [];
          snapshot.forEach(doc => fetchedPolls.push({id: doc.id, ...doc.data()} as Poll));
          setPolls(fetchedPolls);
      });
      return () => unsub();
  }, []);

  const cleanup = async () => {
      localStreamRef.current?.getTracks().forEach(track => track.stop());
      screenStreamRef.current?.getTracks().forEach(track => track.stop());
      pcsRef.current.forEach(pc => pc.close());
      pcsRef.current.clear();
      unsubscribesRef.current.forEach(unsub => unsub());

      if (role === 'student' && auth.currentUser) {
          try { await deleteDoc(doc(db, `rooms/${ROOM_ID}/participants`, auth.currentUser.uid)); } catch(e) {}
      } else if (role === 'admin') {
          try { await updateDoc(doc(db, "rooms", ROOM_ID), { active: false }); } catch(e) {}
      }
  };

  const createRoom = async () => {
      await setDoc(doc(db, "rooms", ROOM_ID), { active: true, startedAt: serverTimestamp() }, { merge: true });
      const unsub = onSnapshot(collection(db, `rooms/${ROOM_ID}/participants`), (snapshot) => {
          snapshot.docChanges().forEach(async (change) => {
              if (change.type === 'added') await callUser(change.doc.id);
          });
      });
      unsubscribesRef.current.push(unsub);
  };

  const callUser = async (userId: string) => {
      if (!localStreamRef.current) return;
      if (pcsRef.current.has(userId)) return; 
      
      const pc = new RTCPeerConnection(iceServers);
      pcsRef.current.set(userId, pc);

      const streamToSend = isScreenSharingRef.current && screenStreamRef.current ? screenStreamRef.current : localStreamRef.current;
      streamToSend.getTracks().forEach(track => pc.addTrack(track, streamToSend));

      pc.ontrack = (event) => {
          const stream = event.streams[0] || new MediaStream();
          if (event.streams.length === 0) stream.addTrack(event.track);
          setRemoteStreams(prev => new Map(prev).set(userId, stream));
      };

      const participantsRef = doc(db, `rooms/${ROOM_ID}/participants`, userId);
      const callerCandidatesCollection = collection(participantsRef, 'callerCandidates');
      
      pc.onicecandidate = (event) => {
          if (event.candidate) addDoc(callerCandidatesCollection, event.candidate.toJSON());
      };

      const offerDescription = await pc.createOffer();
      await pc.setLocalDescription(offerDescription);
      await updateDoc(participantsRef, { offer: { sdp: offerDescription.sdp, type: offerDescription.type } });

      unsubscribesRef.current.push(onSnapshot(participantsRef, (snapshot) => {
          const data = snapshot.data();
          if (!pc.currentRemoteDescription && data?.answer) {
              pc.setRemoteDescription(new RTCSessionDescription(data.answer));
          }
      }));

      unsubscribesRef.current.push(onSnapshot(collection(participantsRef, 'calleeCandidates'), (snapshot) => {
          snapshot.docChanges().forEach((change) => {
              if (change.type === 'added') {
                  const candidate = new RTCIceCandidate(change.doc.data());
                  if (pc.remoteDescription) pc.addIceCandidate(candidate);
              }
          });
      }));
  };

  const joinRoom = async () => {
      if (!localStreamRef.current || !auth.currentUser) return;
      const userId = auth.currentUser.uid;
      const participantRef = doc(db, `rooms/${ROOM_ID}/participants`, userId);
      await setDoc(participantRef, { joined: true });

      unsubscribesRef.current.push(onSnapshot(participantRef, async (snapshot) => {
          const data = snapshot.data();
          if (data?.offer && !pcsRef.current.has('admin')) {
              const pc = new RTCPeerConnection(iceServers);
              pcsRef.current.set('admin', pc);

              localStreamRef.current!.getTracks().forEach(track => pc.addTrack(track, localStreamRef.current!));

              pc.ontrack = (event) => {
                  const stream = event.streams[0] || new MediaStream();
                  if (event.streams.length === 0) stream.addTrack(event.track);
                  setRemoteStreams(prev => new Map(prev).set('admin', stream));
              };

              const calleeCandidatesCollection = collection(participantRef, 'calleeCandidates');
              pc.onicecandidate = (event) => {
                  if (event.candidate) addDoc(calleeCandidatesCollection, event.candidate.toJSON());
              };

              await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
              const answerDesc = await pc.createAnswer();
              await pc.setLocalDescription(answerDesc);
              await updateDoc(participantRef, { answer: { type: answerDesc.type, sdp: answerDesc.sdp } });

              unsubscribesRef.current.push(onSnapshot(collection(participantRef, 'callerCandidates'), (snapshot) => {
                  snapshot.docChanges().forEach((change) => {
                      if (change.type === 'added') {
                          const candidate = new RTCIceCandidate(change.doc.data());
                          if (pc.remoteDescription) pc.addIceCandidate(candidate);
                      }
                  });
              }));
          }
      }));
  };

  const toggleScreenShare = async () => {
    if (role !== 'admin') return;
    if (!isScreenSharing) {
        try {
            const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
            screenStreamRef.current = stream;
            setIsScreenSharing(true);
            isScreenSharingRef.current = true;
            setLocalStream(stream);

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
        } catch (err) { console.error("Error sharing screen", err); }
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
      isScreenSharingRef.current = false;
  };

  const handleSendMessage = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newMessage.trim() || !auth.currentUser) return;
      const msg: ChatMessage = {
          id: Date.now().toString(),
          sender: 'user',
          senderName: auth.currentUser.displayName || 'Student',
          text: newMessage,
          timestamp: new Date()
      };
      await setDoc(doc(db, `rooms/${ROOM_ID}/messages`, msg.id), { ...msg, timestamp: serverTimestamp() });
      setNewMessage('');
  };

  const createPoll = async () => {
      if (!newPollQuestion || newPollOptions.some(o => !o.trim())) return;
      await addDoc(collection(db, `rooms/${ROOM_ID}/polls`), {
          question: newPollQuestion,
          options: newPollOptions.map((text, idx) => ({ id: idx, text, votes: 0 })),
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
      const updatedOptions = poll.options.map(opt => opt.id === optionId ? { ...opt, votes: opt.votes + 1 } : opt);
      await updateDoc(pollRef, { options: updatedOptions });
  };

  return (
    <div className="flex flex-col h-full bg-neutral-950 font-sans">
      <header className="h-14 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between px-6 shrink-0 z-20">
          <div className="flex items-center gap-3">
              <span className="flex h-3 w-3 relative">
                 <span className="animate-ping absolute inline-flex h-full w-full bg-red-400 opacity-75"></span>
                 <span className="relative inline-flex h-3 w-3 bg-red-500"></span>
              </span>
              <h1 className="text-white font-semibold text-sm tracking-wide">Python Masterclass: Live Session</h1>
          </div>
          <div className="flex items-center gap-4">
              <div className="flex items-center text-neutral-400 text-xs">
                  <Users size={14} className="mr-1.5" />
                  <span>{role === 'admin' ? remoteStreams.size : (remoteStreams.size > 0 ? 'Connected' : 'Connecting...')}</span>
              </div>
          </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
          {/* Main Stage */}
          <div className="flex-1 flex flex-col relative">
              <div className="flex-1 bg-neutral-950 p-6 flex items-center justify-center">
                  <div className="w-full max-w-5xl aspect-video bg-black shadow-xl overflow-hidden border border-neutral-800 relative">
                     {role === 'admin' ? (
                         <VideoPlayer 
                            key={localStream?.id || 'local'}
                            stream={localStream} 
                            isLocal={true} 
                            label="Instructor" 
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
                     {role === 'admin' && Array.from(remoteStreams.entries()).map(([id, stream]) => (
                         <audio key={`audio-${id}`} autoPlay ref={ref => { if (ref && ref.srcObject !== stream) ref.srcObject = stream; }} />
                     ))}
                  </div>
              </div>

              {/* Control Bar */}
              <div className="h-20 bg-neutral-900 border-t border-neutral-800 flex items-center justify-center gap-3 px-6 shrink-0">
                  <button onClick={() => { if (localStreamRef.current) { localStreamRef.current.getAudioTracks().forEach(t => t.enabled = !isMicOn); setIsMicOn(!isMicOn); }}} 
                    className={`p-3 transition-all border ${isMicOn ? 'bg-neutral-800 border-neutral-700 text-white hover:bg-neutral-700' : 'bg-red-500/10 border-red-500/50 text-red-500'}`} title="Toggle Mic">
                    {isMicOn ? <Mic size={20} /> : <MicOff size={20} />}
                  </button>
                  
                  <button onClick={() => { if (localStreamRef.current) { localStreamRef.current.getVideoTracks().forEach(t => t.enabled = !isVideoOn); setIsVideoOn(!isVideoOn); }}} 
                    className={`p-3 transition-all border ${isVideoOn ? 'bg-neutral-800 border-neutral-700 text-white hover:bg-neutral-700' : 'bg-red-500/10 border-red-500/50 text-red-500'}`} title="Toggle Video">
                    {isVideoOn ? <Video size={20} /> : <VideoOff size={20} />}
                  </button>

                  {role === 'admin' && (
                    <button onClick={toggleScreenShare} 
                        className={`p-3 transition-all border ${isScreenSharing ? 'bg-blue-600 border-blue-500 text-white' : 'bg-neutral-800 border-neutral-700 text-white hover:bg-neutral-700'}`} title="Share Screen">
                        <ScreenShare size={20} />
                    </button>
                  )}

                  <div className="w-px h-8 bg-neutral-700 mx-2"></div>

                  <button onClick={() => setShowAiHelp(!showAiHelp)} className="p-3 bg-neutral-800 border border-neutral-700 text-purple-400 hover:bg-neutral-700 transition-all" title="AI Assistant">
                      <HelpCircle size={20} />
                  </button>

                  <button onClick={onLeave} className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium ml-4 transition-colors">
                      Leave Class
                  </button>
              </div>
          </div>

          {/* Right Sidebar (Chat) */}
          <div className="w-80 bg-neutral-900 border-l border-neutral-800 flex flex-col shrink-0">
              <div className="flex border-b border-neutral-800">
                  <button onClick={() => setActiveTab('chat')} className={`flex-1 py-3 text-xs font-semibold uppercase tracking-wide ${activeTab === 'chat' ? 'text-blue-400 border-b-2 border-blue-400 bg-neutral-800/50' : 'text-neutral-500 hover:bg-neutral-800/30'}`}>Chat</button>
                  <button onClick={() => setActiveTab('polls')} className={`flex-1 py-3 text-xs font-semibold uppercase tracking-wide ${activeTab === 'polls' ? 'text-blue-400 border-b-2 border-blue-400 bg-neutral-800/50' : 'text-neutral-500 hover:bg-neutral-800/30'}`}>Polls</button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-neutral-900">
                  {activeTab === 'chat' ? (
                      chatMessages.map(msg => {
                          const isMe = msg.senderName.includes(auth.currentUser?.displayName || 'xx');
                          return (
                            <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                <div className="text-[10px] text-neutral-500 mb-1 px-1">{msg.senderName}</div>
                                <div className={`px-3 py-2 text-sm max-w-[90%] ${isMe ? 'bg-blue-600 text-white' : 'bg-neutral-800 text-neutral-200 border border-neutral-700'}`}>
                                    {msg.text}
                                </div>
                            </div>
                          );
                      })
                  ) : (
                      <div className="space-y-4">
                          {role === 'admin' && (
                              <div className="p-3 bg-neutral-800 border border-neutral-700">
                                  <input value={newPollQuestion} onChange={e => setNewPollQuestion(e.target.value)} placeholder="Poll Question" className="w-full bg-neutral-900 border border-neutral-700 p-2 text-sm text-white mb-2 focus:border-blue-500 outline-none" />
                                  {newPollOptions.map((opt, idx) => (
                                      <input key={idx} value={opt} onChange={e => {const n=[...newPollOptions];n[idx]=e.target.value;setNewPollOptions(n)}} placeholder={`Option ${idx+1}`} className="w-full bg-neutral-900 border border-neutral-700 p-1.5 text-xs text-white mb-2 focus:border-blue-500 outline-none" />
                                  ))}
                                  <div className="flex gap-2">
                                      <button onClick={()=>setNewPollOptions([...newPollOptions, ''])} className="text-xs bg-neutral-700 text-neutral-300 px-2 py-1 hover:bg-neutral-600">+ Opt</button>
                                      <button onClick={createPoll} className="text-xs bg-blue-600 text-white px-3 py-1 hover:bg-blue-500 ml-auto font-medium">Create</button>
                                  </div>
                              </div>
                          )}
                          {polls.map(poll => (
                              <div key={poll.id} className="bg-neutral-800/50 p-3 border border-neutral-700">
                                  <h4 className="text-sm font-medium text-white mb-2">{poll.question}</h4>
                                  <div className="space-y-1.5">
                                      {poll.options.map(opt => {
                                          const total = poll.options.reduce((a,b)=>a+b.votes,0);
                                          const pct = total>0?Math.round((opt.votes/total)*100):0;
                                          return (
                                              <button key={opt.id} onClick={()=>votePoll(poll.id, opt.id)} className="w-full relative h-8 bg-neutral-900 border border-neutral-700 overflow-hidden text-left hover:border-blue-500/50 transition-colors">
                                                  <div className="absolute top-0 left-0 h-full bg-blue-500/20" style={{width: `${pct}%`}}></div>
                                                  <div className="absolute inset-0 flex items-center justify-between px-3">
                                                      <span className="text-xs text-neutral-300 truncate">{opt.text}</span>
                                                      <span className="text-xs font-bold text-blue-400">{pct}%</span>
                                                  </div>
                                              </button>
                                          )
                                      })}
                                  </div>
                              </div>
                          ))}
                      </div>
                  )}
              </div>

              {activeTab === 'chat' && (
                <form onSubmit={handleSendMessage} className="p-3 bg-neutral-900 border-t border-neutral-800">
                    <div className="relative">
                        <input value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="Type a message..." className="w-full bg-neutral-950 border border-neutral-700 pl-3 pr-10 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500" />
                        <button type="submit" className="absolute right-1.5 top-1.5 p-1 text-neutral-400 hover:text-blue-500 transition-colors"><Send size={16} /></button>
                    </div>
                </form>
              )}
          </div>
      </div>

      {showAiHelp && (
        <div className="absolute bottom-24 right-96 w-80 bg-neutral-900 border border-neutral-700 shadow-xl overflow-hidden flex flex-col z-50">
            <div className="bg-neutral-800 p-3 border-b border-neutral-700 flex justify-between items-center">
                <span className="text-xs font-bold text-white uppercase flex items-center"><Activity size={12} className="mr-1 text-purple-400"/> AI Assistant</span>
                <button onClick={()=>setShowAiHelp(false)} className="text-neutral-400 hover:text-white"><X size={14}/></button>
            </div>
            <div className="p-3 max-h-48 overflow-y-auto bg-neutral-900 text-xs text-neutral-300 whitespace-pre-wrap leading-relaxed">
                {aiResponse || "Ask a question about the current topic."}
            </div>
            <div className="p-2 border-t border-neutral-800 flex gap-2">
                <input value={aiQuestion} onChange={e=>setAiQuestion(e.target.value)} placeholder="Ask..." className="flex-1 bg-neutral-950 border border-neutral-700 px-2 py-1 text-xs text-white focus:border-purple-500 outline-none" onKeyDown={e=>e.key==='Enter'&&!isAiThinking && (async()=>{setIsAiThinking(true);setAiResponse(await getAiAssistance("Context: Live Class",aiQuestion));setIsAiThinking(false)})()}/>
                <button onClick={async()=>{setIsAiThinking(true);setAiResponse(await getAiAssistance("Context: Live Class",aiQuestion));setIsAiThinking(false)}} disabled={isAiThinking} className="bg-purple-600 text-white px-3 text-xs hover:bg-purple-500 font-medium">Ask</button>
            </div>
        </div>
      )}
    </div>
  );
};

export default LiveClassroom;
