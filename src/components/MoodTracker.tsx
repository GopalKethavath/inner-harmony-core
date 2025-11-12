import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Smile, Meh, Frown } from "lucide-react";

interface MoodTrackerProps {
  userId: string;
}

interface Mood {
  id: string;
  mood_level: number;
  notes: string;
  created_at: string;
}

const MoodTracker = ({ userId }: MoodTrackerProps) => {
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [notes, setNotes] = useState("");
  const [recentMoods, setRecentMoods] = useState<Mood[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchRecentMoods();
  }, [userId]);

  const fetchRecentMoods = async () => {
    const { data, error } = await supabase
      .from("moods")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(7);

    if (!error && data) {
      setRecentMoods(data);
    }
  };

  const handleSaveMood = async () => {
    if (!selectedMood) {
      toast({ title: "Please select a mood level", variant: "destructive" });
      return;
    }

    setLoading(true);
    const { error } = await supabase.from("moods").insert({
      user_id: userId,
      mood_level: selectedMood,
      notes: notes.trim(),
    });

    if (error) {
      toast({ title: "Error saving mood", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Mood logged successfully!", description: "Keep tracking your wellness journey." });
      setSelectedMood(null);
      setNotes("");
      fetchRecentMoods();
    }
    setLoading(false);
  };

  const getMoodEmoji = (level: number) => {
    if (level >= 4) return <Smile className="h-6 w-6 text-green-500" />;
    if (level === 3) return <Meh className="h-6 w-6 text-yellow-500" />;
    return <Frown className="h-6 w-6 text-orange-500" />;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>How are you feeling today?</CardTitle>
          <CardDescription>Track your daily mood to understand patterns over time</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3 justify-center">
            {[1, 2, 3, 4, 5].map((level) => (
              <button
                key={level}
                onClick={() => setSelectedMood(level)}
                className={`p-4 rounded-xl border-2 transition-all hover:scale-105 ${
                  selectedMood === level
                    ? "border-primary bg-primary/10 shadow-lg"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <div className="text-2xl">{level === 5 ? "😄" : level === 4 ? "🙂" : level === 3 ? "😐" : level === 2 ? "😕" : "😢"}</div>
              </button>
            ))}
          </div>
          <Textarea
            placeholder="Add notes about your mood (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="min-h-[100px]"
          />
          <Button onClick={handleSaveMood} disabled={loading} className="w-full">
            {loading ? "Saving..." : "Log Mood"}
          </Button>
        </CardContent>
      </Card>

      {recentMoods.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Moods</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentMoods.map((mood) => (
                <div key={mood.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  {getMoodEmoji(mood.mood_level)}
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">
                      {new Date(mood.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </p>
                    {mood.notes && <p className="text-sm mt-1">{mood.notes}</p>}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MoodTracker;
