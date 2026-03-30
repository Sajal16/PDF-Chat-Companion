import { useAuth } from "@/hooks/useAuth";
import Login from "./Login";
import Chat from "./Chat";

export default function Index() {
  const { user, login, signup, logout, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Login onLogin={login} onSignup={signup} />;
  }

  const userName = user.name || "User";

  return (
    <Chat
      userName={userName}
      userImage={`https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=0D8ABC&color=fff`}
      onLogout={logout}
    />
  );
}