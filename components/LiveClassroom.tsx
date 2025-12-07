
import React, { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Video, VideoOff, PhoneOff, MessageSquare, Users, ScreenShare, Shield, Activity } from 'lucide-react';
import { ChatMessage, Role } from '../types';
import { db, auth } from '../services/firebase';
import { collection, doc, setDoc, onSnapshot, addDoc, updateDoc, getDoc, deleteDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';

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

const LiveClassroom: React.FC<LiveClassroomProps> = ({ role = 'student', onLeave }) => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  
  // Refs for WebRTC management
  const pcsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);
  const unsubscribesRef = useRef<(() => void)[]>([]);

  const ROOM_ID = 'main-class';

  // 1. Initialize Media
  useEffect(() => {
    const startLocalStream = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setLocalStream(stream);
        localStreamRef.current = stream;
        
        // If Admin, start the room logic
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
     const q = query(collection(db, `rooms/${ROOM_ID}/messages`), orderBy('timestamp', 'asc'));
     const unsub = onSnapshot(q, (snapshot) => {
         const msgs: ChatMessage[] = [];
         snapshot.forEach(doc => msgs.push(doc.data() as ChatMessage));
         setChatMessages(msgs);
     });
     return () => unsub();
  }, []);

  const cleanup = async () => {
      // Stop tracks
      localStreamRef.current?.getTracks().forEach(track => track.stop());
      
      // Close Peer Connections
      pcsRef.current.forEach(pc => pc.close());
      pcsRef.current.clear();

      // Unsubscribe listeners
      unsubscribesRef.current.forEach(unsub => unsub());

      // If student, delete participant doc
      if (role === 'student' && auth.currentUser) {
          await deleteDoc(doc(db, `rooms/${ROOM_ID}/participants`, auth.currentUser.uid));
      }
  };

  // --- ADMIN LOGIC ---
  const createRoom = async () => {
      const roomRef = doc(db, "rooms", ROOM_ID);
      await setDoc(roomRef, { active: true, startedAt: serverTimestamp() });

      // Listen for students joining
      const participantsRef = collection(db, `rooms/${ROOM_ID}/participants`);
      const unsub = onSnapshot(participantsRef, (snapshot) => {
          snapshot.docChanges().forEach(async (change) => {
              const userId = change.doc.id;
              if (change.type === 'added') {
                  // New student joined, call them
                  await callUser(userId);
              }
          });
      });
      unsubscribesRef.current.push(unsub);
  };

  const callUser = async (userId: string) => {
      if (!localStreamRef.current) return;
      
      console.log(`Calling student: ${userId}`);
      const pc = new RTCPeerConnection(iceServers);
      pcsRef.current.set(userId, pc);

      // Add local tracks
      localStreamRef.current.getTracks().forEach(track => {
          pc.addTrack(track, localStreamRef.current!);
      });

      // Handle remote tracks (Student video)
      pc.ontrack = (event) => {
          event.streams[0].getTracks().forEach(track => {
              const remoteStream = new MediaStream();
              remoteStream.addTrack(track);
              setRemoteStreams(prev => new Map(prev).set(userId, remoteStream));
          });
      };

      // Collect ICE candidates
      const participantsRef = doc(db, `rooms/${ROOM_ID}/participants`, userId);
      const callerCandidatesCollection = collection(participantsRef, 'callerCandidates');
      pc.onicecandidate = (event) => {
          if (event.candidate) {
              addDoc(callerCandidatesCollection, event.candidate.toJSON());
          }
      };

      // Create Offer
      const offerDescription = await pc.createOffer();
      await pc.setLocalDescription(offerDescription);

      const offer = {
          sdp: offerDescription.sdp,
          type: offerDescription.type,
      };

      await updateDoc(participantsRef, { offer });

      // Listen for Answer
      const unsub = onSnapshot(participantsRef, (snapshot) => {
          const data = snapshot.data();
          if (!pc.currentRemoteDescription && data?.answer) {
              const answerDescription = new RTCSessionDescription(data.answer);
              pc.setRemoteDescription(answerDescription);
          }
      });
      unsubscribesRef.current.push(unsub);

      // Listen for Callee Candidates
      const calleeCandidatesCollection = collection(participantsRef, 'calleeCandidates');
      const unsubCandidates = onSnapshot(calleeCandidatesCollection, (snapshot) => {
          snapshot.docChanges().forEach((change) => {
              if (change.type === 'added') {
                  const data = change.doc.data();
                  pc.addIceCandidate(new RTCIceCandidate(data));
              }
          });
      });
      unsubscribesRef.current.push(unsubCandidates);
  };

  // --- STUDENT LOGIC ---
  const joinRoom = async () => {
      if (!localStreamRef.current || !auth.currentUser) return;
      const userId = auth.currentUser.uid;

      // Create Participant Doc
      const participantRef = doc(db, `rooms/${ROOM_ID}/participants`, userId);
      await setDoc(participantRef, { joined: true });

      // Listen for Offer from Admin
      const unsub = onSnapshot(participantRef, async (snapshot) => {
          const data = snapshot.data();
          if (data?.offer && !pcsRef.current.has('admin')) {
              console.log("Received Offer from Admin");
              const pc = new RTCPeerConnection(iceServers);
              pcsRef.current.set('admin', pc);

              // Add local tracks
              localStreamRef.current!.getTracks().forEach(track => {
                  pc.addTrack(track, localStreamRef.current!);
              });

              // Handle remote tracks (Admin video)
              pc.ontrack = (event) => {
                  event.streams[0].getTracks().forEach(track => {
                      const remoteStream = new MediaStream();
                      remoteStream.addTrack(track);
                      setRemoteStreams(prev => new Map(prev).set('admin', remoteStream));
                  });
              };

              // Collect ICE candidates
              const calleeCandidatesCollection = collection(participantRef, 'calleeCandidates');
              pc.onicecandidate = (event) => {
                  if (event.candidate) {
                      addDoc(calleeCandidatesCollection, event.candidate.toJSON());
                  }
              };

              // Set Remote Desc (Offer)
              const offerDesc = new RTCSessionDescription(data.offer);
              await pc.setRemoteDescription(offerDesc);

              // Create Answer
              const answerDesc = await pc.createAnswer();
              await pc.setLocalDescription(answerDesc);

              const answer = {
                  type: answerDesc.type,
                  sdp: answerDesc.sdp,
              };

              await updateDoc(participantRef, { answer });

              // Listen for Caller Candidates (from Admin)
              const callerCandidatesCollection = collection(participantRef, 'callerCandidates');
              const unsubCandidates = onSnapshot(callerCandidatesCollection, (snapshot) => {
                  snapshot.docChanges().forEach((change) => {
                      if (change.type === 'added') {
                          const candidateData = change.doc.data();
                          pc.addIceCandidate(new RTCIceCandidate(candidateData));
                      }
                  });
              });
              unsubscribesRef.current.push(unsubCandidates);
          }
      });
      unsubscribesRef.current.push(unsub);
  };

  // --- UTILS ---
  const toggleMic = () => {
      if (localStream) {
          localStream.getAudioTracks().forEach(track => track.enabled = !isMicOn);
          setIsMicOn(!isMicOn);
      }
  };

  const toggleVideo = () => {
      if (localStream) {
          localStream.getVideoTracks().forEach(track => track.enabled = !isVideoOn);
          setIsVideoOn(!isVideoOn);
      }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newMessage.trim() || !auth.currentUser) return;
      
      const msg: ChatMessage = {
          id: Date.now().toString(),
          sender: 'user',
          senderName: auth.currentUser.displayName || (role === 'admin' ? 'Instructor' : 'Student'),
          text: newMessage,
          timestamp: new Date() // Firestore converts this
      };
      
      await addDoc(collection(db, `rooms/${ROOM_ID}/messages`), {
          ...msg,
          timestamp: serverTimestamp()
      });
      setNewMessage('');
  };

  // Render Remote Videos
  const renderRemoteVideos = () => {
    const grids: React.ReactElement[] = [];
    remoteStreams.forEach((stream, id) => {
        grids.push(
            <div key={id} className="relative bg-slate-900 rounded-xl overflow-hidden border border-slate-700 aspect-video">
                <video 
                    autoPlay 
                    playsInline 
                    ref={video => { if (video) video.srcObject = stream }}
                    className="w-full h-full object-cover"
                />
                <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-1 rounded text-xs text-white">
                    {id === 'admin' ? 'Instructor (Live)' : 'Student'}
                </div>
            </div>
        );
    });
    return grids;
  };

  return (
    <div className="flex h-full bg-slate-950">
      {/* Video Area */}
      <div className="flex-1 flex flex-col p-4 relative">
        <div className="flex justify-between items-center mb-4">
            <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Activity className="text-red-500 animate-pulse" size={20} />
                    Live Class: Python Masterclass
                </h2>
            </div>
            <div className="flex items-center gap-2">
                {role === 'admin' && <span className="bg-primary-500/20 text-primary-400 text-xs font-bold px-2 py-1 rounded">HOST</span>}
                <span className="bg-slate-800 text-slate-400 text-xs font-mono px-2 py-1 rounded">{remoteStreams.size + 1} Connected</span>
            </div>
        </div>

        {/* Video Grid */}
        <div className="flex-1 grid grid-cols-2 gap-4 auto-rows-min mb-20 overflow-y-auto">
             {/* Local User */}
             <div className="relative bg-slate-900 rounded-xl overflow-hidden border border-primary-500/30 aspect-video shadow-2xl">
                {localStream ? (
                    <video 
                        autoPlay 
                        muted 
                        playsInline 
                        ref={video => { if (video) video.srcObject = localStream }}
                        className="w-full h-full object-cover transform scale-x-[-1]"
                    />
                ) : (
                    <div className="flex items-center justify-center h-full text-slate-500"><VideoOff /></div>
                )}
                <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-1 rounded text-xs text-white font-bold">
                    You {role === 'admin' ? '(Host)' : ''}
                </div>
             </div>

             {/* Remote Users */}
             {renderRemoteVideos()}
             
             {remoteStreams.size === 0 && role === 'student' && (
                 <div className="col-span-1 flex items-center justify-center bg-slate-900/50 rounded-xl border border-dashed border-slate-700 text-slate-500 p-8">
                     Waiting for Instructor...
                 </div>
             )}
        </div>

        {/* Controls Bar */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-slate-900/90 backdrop-blur px-6 py-3 rounded-2xl border border-slate-700 shadow-2xl z-20">
            <button onClick={toggleMic} className={`p-3 rounded-full ${isMicOn ? 'bg-slate-700 text-white' : 'bg-red-500/20 text-red-500'}`}>
                {isMicOn ? <Mic size={20} /> : <MicOff size={20} />}
            </button>
            <button onClick={toggleVideo} className={`p-3 rounded-full ${isVideoOn ? 'bg-slate-700 text-white' : 'bg-red-500/20 text-red-500'}`}>
                {isVideoOn ? <Video size={20} /> : <VideoOff size={20} />}
            </button>
            <button onClick={onLeave} className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold ml-4">
                Leave Class
            </button>
        </div>
      </div>

      {/* Chat Sidebar */}
      <div className="w-80 bg-slate-900 border-l border-slate-800 flex flex-col">
          <div className="p-4 border-b border-slate-800 font-bold text-white flex items-center gap-2">
              <MessageSquare size={18} /> Class Chat
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {chatMessages.map(msg => (
                  <div key={msg.id} className={`flex flex-col ${msg.senderName.includes(auth.currentUser?.displayName || 'x') ? 'items-end' : 'items-start'}`}>
                      <span className="text-[10px] text-slate-500 mb-0.5">{msg.senderName}</span>
                      <div className={`px-3 py-2 rounded-lg text-sm max-w-[90%] ${msg.senderName.includes(auth.currentUser?.displayName || 'x') ? 'bg-primary-600 text-white' : 'bg-slate-800 text-slate-300'}`}>
                          {msg.text}
                      </div>
                  </div>
              ))}
          </div>
          <form onSubmit={handleSendMessage} className="p-3 bg-slate-950 border-t border-slate-800">
              <input 
                  type="text" 
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary-500"
              />
          </form>
      </div>
    </div>
  );
};

export default LiveClassroom;
