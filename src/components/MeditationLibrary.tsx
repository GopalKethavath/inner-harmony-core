import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Play } from "lucide-react";

interface Meditation {
  id: string;
  title: string;
  description: string;
  duration_minutes: number;
  category: string;
  audio_url: string | null;
  image_url: string | null;
}

const MeditationLibrary = () => {
  const [meditations, setMeditations] = useState<Meditation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMeditations();
  }, []);

  const fetchMeditations = async () => {
    const { data, error } = await supabase
      .from("meditations")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setMeditations(data);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (meditations.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">No meditations available yet. Check back soon!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {meditations.map((meditation) => (
        <Card key={meditation.id} className="overflow-hidden hover:shadow-lg transition-shadow">
          {meditation.image_url && (
            <div className="h-48 bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
              <Play className="h-12 w-12 text-primary" />
            </div>
          )}
          <CardHeader>
            <div className="flex items-start justify-between gap-2">
              <CardTitle className="text-xl">{meditation.title}</CardTitle>
              <Badge variant="secondary">{meditation.category}</Badge>
            </div>
            <CardDescription className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4" />
              {meditation.duration_minutes} minutes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{meditation.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default MeditationLibrary;
