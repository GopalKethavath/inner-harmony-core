import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogOut, Brain } from "lucide-react";
import MoodTracker from "@/components/MoodTracker";
import MeditationLibrary from "@/components/MeditationLibrary";
import SymptomChecker from "@/components/SymptomChecker";
import TherapistBooking from "@/components/TherapistBooking";

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
      } else {
        navigate("/auth");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleSignOut = async () => {
    await signOut(auth);
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-primary/5">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Brain className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">MindCare</h1>
              {user?.displayName && (
                <p className="text-xs text-muted-foreground">{user.displayName}</p>
              )}
            </div>
          </div>
          <Button onClick={handleSignOut} variant="outline" size="sm">
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Welcome back!</h2>
          <p className="text-muted-foreground">Continue your wellness journey</p>
        </div>

        <Tabs defaultValue="mood" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto">
            <TabsTrigger value="mood">Mood Tracker</TabsTrigger>
            <TabsTrigger value="meditations">Meditations</TabsTrigger>
            <TabsTrigger value="symptoms">Symptom Checker</TabsTrigger>
            <TabsTrigger value="therapists">Book Therapist</TabsTrigger>
          </TabsList>

          <TabsContent value="mood">
            <MoodTracker userId={user?.uid || ""} />
          </TabsContent>

          <TabsContent value="meditations">
            <MeditationLibrary />
          </TabsContent>

          <TabsContent value="symptoms">
            <SymptomChecker userId={user?.uid || ""} />
          </TabsContent>

          <TabsContent value="therapists">
            <TherapistBooking userId={user?.uid || ""} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Dashboard;
