
import React, { useState } from 'react';
import { User, ShieldCheck, ArrowRight, AlertTriangle } from 'lucide-react';
import { User as UserType, UserStatus } from '../types';
import { auth, db } from '../services/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, signOut, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { APP_LOGO } from '../constants';

interface LoginProps {
  onLogin: (user: UserType) => void;
}

const ADMIN_EMAILS = [
  "admin@apexcode.com", 
  "test@example.com",
  "stusanthosh5195@gmail.com"
];

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [role, setRole] = useState<'student' | 'admin'>('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showApiLink, setShowApiLink] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setShowApiLink(false);

    try {
      let firebaseUser;
      let userRole = role;
      let userStatus: UserStatus = 'pending';
      let completedLessonIds: string[] = [];
      let progress: any = {};
      const isSuperAdmin = ADMIN_EMAILS.includes(email.toLowerCase());

      if (isSignUp) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        firebaseUser = userCredential.user;
        await updateProfile(firebaseUser, { displayName: name });

        if (isSuperAdmin) { userRole = 'admin'; userStatus = 'active'; }
        else if (userRole === 'admin') { userStatus = 'active'; }
        else { userStatus = 'pending'; }

        await setDoc(doc(db, "users", firebaseUser.uid), {
          role: userRole, status: userStatus, email: email, name: name, completedLessonIds: [], progress: {}, joinedAt: serverTimestamp()
        });
      } else {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        firebaseUser = userCredential.user;
        const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
        
        if (userDoc.exists()) {
          const data = userDoc.data();
          let dbRole = data.role as 'student' | 'admin';
          let dbStatus = data.status as UserStatus || 'pending';
          
          if (isSuperAdmin && dbRole !== 'admin') {
              dbRole = 'admin'; dbStatus = 'active';
              await updateDoc(doc(db, "users", firebaseUser.uid), { role: 'admin', status: 'active' });
          }
          if (role === 'admin' && dbRole !== 'admin') {
             await signOut(auth);
             throw new Error("Access Denied: You do not have administrator privileges.");
          }
          userRole = dbRole; userStatus = dbStatus; completedLessonIds = data.completedLessonIds || []; progress = data.progress || {};
        } else {
             userRole = isSuperAdmin ? 'admin' : 'student'; userStatus = isSuperAdmin ? 'active' : 'pending';
             await setDoc(doc(db, "users", firebaseUser.uid), { role: userRole, status: userStatus, progress: {} }, { merge: true });
        }
      }

      onLogin({
        id: firebaseUser.uid,
        name: firebaseUser.displayName || name || email.split('@')[0],
        email: firebaseUser.email || email,
        role: userRole,
        status: userStatus,
        avatar: firebaseUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${firebaseUser.uid}`,
        completedLessonIds: completedLessonIds,
        progress: progress
      });

    } catch (err: any) {
      console.error(err);
      handleError(err);
    } finally { setIsLoading(false); }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true); setError(''); setShowApiLink(false);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const userEmail = user.email ? user.email.toLowerCase() : '';
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);
      
      let userRole = role; let userStatus: UserStatus = 'pending'; let completedLessonIds: string[] = []; let progress: any = {};
      const isSuperAdmin = ADMIN_EMAILS.includes(userEmail);

      if (!userDoc.exists()) {
          if (isSuperAdmin) { userRole = 'admin'; userStatus = 'active'; }
          else if (userRole === 'admin') { userStatus = 'active'; }
          else { userStatus = 'pending'; }

          await setDoc(userDocRef, {
              role: userRole, status: userStatus, email: user.email, name: user.displayName || name || '',
              avatar: user.photoURL, completedLessonIds: [], progress: {}, joinedAt: serverTimestamp()
          });
      } else {
          const userData = userDoc.data();
          userRole = userData.role; userStatus = userData.status || 'pending';
          completedLessonIds = userData.completedLessonIds || []; progress = userData.progress || {};

          if (isSuperAdmin && userRole !== 'admin') {
              userRole = 'admin'; userStatus = 'active';
              await updateDoc(userDocRef, { role: 'admin', status: 'active' });
          }
          if (role === 'admin' && userRole !== 'admin') {
              await signOut(auth); throw new Error("Access Denied: You do not have administrator privileges.");
          }
      }

      onLogin({
        id: user.uid, name: user.displayName || 'User', email: user.email || '', role: userRole, status: userStatus,
        avatar: user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`, completedLessonIds: completedLessonIds, progress: progress
      });
    } catch (err: any) { handleError(err); setIsLoading(false); }
  };

  const handleError = (err: any) => {
    let msg = err.message;
    if (err.message.includes("Cloud Firestore API has not been used")) { msg = "Database API is not enabled."; setShowApiLink(true); } 
    else if (err.code === 'permission-denied') { msg = "Access Denied: You do not have permission."; }
    else if (err.code === 'auth/unauthorized-domain') { msg = `Domain not authorized. Check Firebase Console.`; }
    setError(msg.replace('Firebase:', '').trim());
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-700">
             <img src={APP_LOGO} alt="Logo" className="w-10 h-10" />
          </div>
          <h1 className="text-xl font-bold text-white mb-1">{isSignUp ? 'Create Account' : 'Sign In'}</h1>
          <p className="text-slate-500 text-sm">{isSignUp ? 'Join Apex Code Labs.' : 'Welcome back to the platform.'}</p>
        </div>

        <div className="flex bg-slate-950 p-1 rounded-lg mb-6 border border-slate-800">
            <button type="button" onClick={() => setRole('student')} className={`flex-1 flex items-center justify-center py-2 rounded-md text-sm font-medium transition-colors ${role === 'student' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}>
                <User size={14} className="mr-2" /> Student
            </button>
            <button type="button" onClick={() => setRole('admin')} className={`flex-1 flex items-center justify-center py-2 rounded-md text-sm font-medium transition-colors ${role === 'admin' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}>
                <ShieldCheck size={14} className="mr-2" /> Admin
            </button>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          {isSignUp && (
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Full Name</label>
              <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 text-sm" />
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Email</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Password</label>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 text-sm" />
          </div>

          {error && (
            <div className="p-3 bg-red-900/20 border border-red-900/30 rounded-lg text-red-400 text-sm flex flex-col items-start">
              <div className="flex items-center gap-2"><AlertTriangle size={16} /><span>{error}</span></div>
              {showApiLink && <a href="https://console.developers.google.com/apis/api/firestore.googleapis.com/overview?project=codesphere-35dae" target="_blank" rel="noopener noreferrer" className="ml-6 mt-1 text-blue-400 hover:underline text-xs">Enable API &rarr;</a>}
            </div>
          )}

          <button type="submit" disabled={isLoading} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center text-sm">
            {isLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : (isSignUp ? 'Create Account' : 'Sign In')}
          </button>
        </form>

        <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-800"></div></div>
            <div className="relative flex justify-center text-xs"><span className="px-2 bg-slate-900 text-slate-500 uppercase">Or</span></div>
        </div>

        <button type="button" onClick={handleGoogleLogin} disabled={isLoading} className="w-full bg-white text-slate-900 font-semibold py-2.5 rounded-lg transition-colors hover:bg-slate-200 flex items-center justify-center mb-4 text-sm">
             <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
            Google
        </button>

        <div className="text-center">
          <button onClick={() => { setIsSignUp(!isSignUp); setError(''); setShowApiLink(false); }} className="text-sm text-slate-400 hover:text-white transition-colors">
            {isSignUp ? 'Already have an account? Log in' : "Don't have an account? Sign Up"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
