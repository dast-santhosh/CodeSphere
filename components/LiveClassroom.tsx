import React, { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Video, VideoOff, PhoneOff, MessageSquare, Users, ScreenShare, Shield } from 'lucide-react';
import { ChatMessage, Role } from '../types';
import { MOCK_CHAT_MESSAGES } from '../constants';

interface LiveClassroomProps {
    role?: Role;
    onLeave?: () => void;
}

const LiveClassroom: React.FC<LiveClassroomProps> = ({ role = 'student', onLeave }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [hasPermission, setHasPermission] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(MOCK_CHAT_MESSAGES);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    let stream: MediaStream | null = null;

    const startVideo = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setHasPermission(true);
      } catch (err) {
        console.error("Error accessing media devices:", err);
        setHasPermission(false);
      }
    };

    if (isVideoOn) {
      startVideo();
    } else {
        if (videoRef.current && videoRef.current.srcObject) {
            const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
            tracks.forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isVideoOn]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const msg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      senderName: role === 'admin' ? 'Instructor' : 'You',
      text: newMessage,
      timestamp: new Date()
    };
    setChatMessages([...chatMessages, msg]);
    setNewMessage('');
  };

  return (
    <div className="flex h-full bg-slate-950">
      {/* Main Video Area */}
      <div className="flex-1 flex flex-col p-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-4 px-2">
            <div>
                <h2 className="text-xl font-bold text-white">Advanced Python: Asynchronous Programming</h2>
                <p className="text-sm text-slate-400">Instructor: Dr. Angela Yu • 14 Students Online</p>
            </div>
            <div className="flex items-center gap-3">
                {role === 'admin' && (
                    <div className="bg-primary-500/10 border border-primary-500/20 text-primary-400 px-3 py-1 rounded-full text-xs font-bold flex items-center">
                        <Shield size={12} className="mr-1" /> HOST
                    </div>
                )}
                <div className="bg-red-500/10 text-red-500 px-3 py-1 rounded-full text-xs font-bold animate-pulse border border-red-500/20">
                    LIVE
                </div>
            </div>
        </div>

        {/* Video Grid */}
        <div className="flex-1 grid grid-cols-2 lg:grid-cols-3 gap-4 mb-4 min-h-0">
            {/* Teacher Stream (Mock) */}
            <div className={`col-span-2 row-span-2 bg-slate-900 rounded-xl relative overflow-hidden border ${role === 'admin' ? 'border-primary-500/50' : 'border-slate-800'} shadow-2xl`}>
                {role === 'admin' ? (
                     // Admin sees themselves here usually, but for demo we put the mock "Teacher view" content or camera
                     <>
                        {isVideoOn && hasPermission ? (
                            <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover transform scale-x-[-1]" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-500">
                                <VideoOff size={48} />
                            </div>
                        )}
                        <div className="absolute bottom-4 left-4 bg-black/60 px-3 py-1 rounded-lg backdrop-blur-md flex items-center">
                            <span className="text-white font-medium text-sm">You (Host)</span>
                        </div>
                     </>
                ) : (
                    <>
                        <img src="https://picsum.photos/800/600" alt="Teacher" className="w-full h-full object-cover opacity-90" />
                        <div className="absolute bottom-4 left-4 bg-black/60 px-3 py-1 rounded-lg backdrop-blur-md">
                            <span className="text-white font-medium text-sm">Dr. Angela Yu (Host)</span>
                        </div>
                    </>
                )}
            </div>

            {/* Student 1 */}
            <div className="bg-slate-900 rounded-xl relative overflow-hidden border border-slate-800">
                 <img src="https://picsum.photos/400/300?random=1" alt="Student" className="w-full h-full object-cover" />
                 <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-0.5 rounded text-xs text-white">Sarah</div>
            </div>

             {/* Student 2 */}
             <div className="bg-slate-900 rounded-xl relative overflow-hidden border border-slate-800">
                 <img src="https://picsum.photos/400/300?random=2" alt="Student" className="w-full h-full object-cover" />
                 <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-0.5 rounded text-xs text-white">Mike</div>
            </div>

            {/* User Self View (If Student) */}
            {role === 'student' && (
                <div className="bg-slate-900 rounded-xl relative overflow-hidden border border-primary-500/50">
                    {isVideoOn && hasPermission ? (
                        <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover transform scale-x-[-1]" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-500">
                            <VideoOff size={32} />
                        </div>
                    )}
                    <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-0.5 rounded text-xs text-white flex items-center">
                        You {!isMicOn && <MicOff size={10} className="ml-1 text-red-400" />}
                    </div>
                </div>
            )}
        </div>

        {/* Controls */}
        <div className="h-16 bg-slate-900 rounded-2xl flex items-center justify-center gap-4 px-4 border border-slate-800 shadow-lg">
            <button 
                onClick={() => setIsMicOn(!isMicOn)}
                className={`p-3 rounded-full transition-all ${isMicOn ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-red-500/20 text-red-500 hover:bg-red-500/30'}`}
            >
                {isMicOn ? <Mic size={20} /> : <MicOff size={20} />}
            </button>
            <button 
                onClick={() => setIsVideoOn(!isVideoOn)}
                className={`p-3 rounded-full transition-all ${isVideoOn ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-red-500/20 text-red-500 hover:bg-red-500/30'}`}
            >
                {isVideoOn ? <Video size={20} /> : <VideoOff size={20} />}
            </button>
            
            {role === 'admin' && (
                 <button className="p-3 rounded-full bg-slate-800 hover:bg-slate-700 text-white transition-all" title="Share Screen">
                    <ScreenShare size={20} />
                </button>
            )}

            <button className="p-3 rounded-full bg-slate-800 hover:bg-slate-700 text-white transition-all">
                <Users size={20} />
            </button>
            
            <div className="w-px h-8 bg-slate-700 mx-2"></div>
            
            <button 
                onClick={onLeave}
                className="px-6 py-2 rounded-full bg-red-600 hover:bg-red-700 text-white font-medium flex items-center transition-all"
            >
                <PhoneOff size={18} className="mr-2" />
                {role === 'admin' ? 'End Class' : 'Leave'}
            </button>
        </div>
      </div>

      {/* Sidebar Chat */}
      <div className="w-80 bg-slate-900 border-l border-slate-800 flex flex-col">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-white flex items-center">
                  <MessageSquare size={18} className="mr-2 text-primary-500" />
                  Class Chat
              </h3>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {chatMessages.map(msg => (
                  <div key={msg.id} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                      <span className="text-xs text-slate-500 mb-1">{msg.senderName}</span>
                      <div className={`p-3 rounded-xl max-w-[85%] text-sm ${msg.sender === 'user' ? 'bg-primary-600 text-white' : 'bg-slate-800 text-slate-200'}`}>
                          {msg.text}
                      </div>
                  </div>
              ))}
          </div>

          <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-800 bg-slate-900">
              <input 
                type="text" 
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary-500 transition-colors"
              />
          </form>
      </div>
    </div>
  );
};

export default LiveClassroom;