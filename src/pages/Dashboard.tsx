import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
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
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
      } else {
        navigate("/auth");
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser(session.user);
      } else {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
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
          <div className="flex items-center gap-2">
            <Brain className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">MindCare</h1>
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
            <MoodTracker userId={user?.id || ""} />
          </TabsContent>

          <TabsContent value="meditations">
            <MeditationLibrary />
          </TabsContent>

          <TabsContent value="symptoms">
            <SymptomChecker userId={user?.id || ""} />
          </TabsContent>

          <TabsContent value="therapists">
            <TherapistBooking userId={user?.id || ""} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Dashboard;
