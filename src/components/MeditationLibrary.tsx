import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Play, X, Wind, Heart, Brain, Zap } from "lucide-react";
import React from "react";

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
  const [error, setError] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    fetchMeditations();
  }, []);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (playingId) {
      interval = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [playingId]);

  const fetchMeditations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: fetchError } = await supabase
        .from("meditations")
        .select("*")
        .order("created_at", { ascending: false });

      if (fetchError) {
        console.error("Error fetching meditations:", fetchError);
        setError(fetchError.message);
        setLoading(false);
        return;
      }

      if (data) {
        console.log("Meditations fetched:", data);
        setMeditations(data);
      }
      setLoading(false);
    } catch (err) {
      console.error("Unexpected error:", err);
      setError("Failed to load meditations");
      setLoading(false);
    }
  };

  const handleStartMeditation = (meditation: Meditation) => {
    if (currentAudio) {
      currentAudio.pause();
    }

    setPlayingId(meditation.id);
    setElapsedTime(0);
    console.log(`Starting meditation: ${meditation.title}`);
    
    if (meditation.audio_url) {
      const audio = new Audio(meditation.audio_url);
      audio.play();
      setCurrentAudio(audio);
    }
  };

  const handleStopMeditation = () => {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    }
    setPlayingId(null);
    setElapsedTime(0);
    setCurrentAudio(null);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getMeditationContent = (category: string) => {
    const contentMap: { [key: string]: { icon: any; tips: string[]; color: string; affirmation: string } } = {
      stress: {
        icon: Zap,
        color: "from-orange-500 to-red-500",
        affirmation: "I release all tension and embrace calm.",
        tips: [
          "Take slow, deep breaths",
          "Focus on relaxing each muscle group",
          "Let go of worries with each exhale",
          "Find your inner peace",
        ],
      },
      sleep: {
        icon: Brain,
        color: "from-indigo-500 to-purple-500",
        affirmation: "I drift into restful, peaceful sleep.",
        tips: [
          "Close your eyes gently",
          "Let your body become heavy",
          "Release the day's tensions",
          "Welcome peaceful dreams",
        ],
      },
      calm: {
        icon: Wind,
        color: "from-blue-500 to-cyan-500",
        affirmation: "I am calm, centered, and peaceful.",
        tips: [
          "Breathe naturally and slowly",
          "Feel the present moment",
          "Let thoughts pass like clouds",
          "Embrace inner tranquility",
        ],
      },
      peace: {
        icon: Heart,
        color: "from-green-500 to-emerald-500",
        affirmation: "Peace flows through my entire being.",
        tips: [
          "Open your heart to positivity",
          "Connect with your inner self",
          "Feel gratitude and compassion",
          "Radiate peaceful energy",
        ],
      },
    };

    return contentMap[category.toLowerCase()] || contentMap.calm;
  };

  const playingMeditation = meditations.find((m) => m.id === playingId);
  const meditationContent = playingMeditation ? getMeditationContent(playingMeditation.category) : null;
  const ContentIcon = meditationContent?.icon;

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading meditations...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-500">
        <CardContent className="p-8">
          <p className="text-red-600 font-semibold">Error: {error}</p>
          <Button onClick={fetchMeditations} className="mt-4">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (meditations.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground text-lg">No meditations available yet. Check back soon!</p>
          <Button onClick={fetchMeditations} variant="outline" className="mt-4">
            Refresh
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Playing Meditation Display */}
      {playingMeditation && meditationContent && (
        <Card className={`border-2 border-primary bg-gradient-to-br ${meditationContent.color} bg-opacity-5`}>
          <CardHeader>
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {ContentIcon && <ContentIcon className="h-6 w-6" />}
                  <CardTitle className="text-2xl">{playingMeditation.title}</CardTitle>
                </div>
                <CardDescription className="flex items-center gap-2 text-sm mb-4">
                  <Clock className="h-4 w-4" />
                  {playingMeditation.duration_minutes} minutes • {playingMeditation.category}
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleStopMeditation}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Affirmation */}
            <div className="p-4 bg-background/80 rounded-lg border-l-4 border-primary">
              <p className="text-center text-lg italic font-semibold">"{meditationContent.affirmation}"</p>
            </div>

            {/* Description */}
            <p className="text-base">{playingMeditation.description}</p>

            {/* Tips */}
            <div className="space-y-3">
              <h3 className="font-semibold text-sm">Meditation Tips:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {meditationContent.tips.map((tip, index) => (
                  <div key={index} className="flex items-start gap-2 p-3 bg-background/50 rounded-lg">
                    <div className="text-primary font-bold mt-1">{index + 1}.</div>
                    <p className="text-sm">{tip}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Timer Display */}
            <div className="p-6 bg-background rounded-lg text-center">
              <div className="text-5xl font-bold text-primary mb-2">
                {formatTime(elapsedTime)}
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                of {playingMeditation.duration_minutes}:00
              </p>
              {/* Progress Bar */}
              <div className="w-full bg-muted rounded-full h-3">
                <div
                  className="bg-primary h-3 rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min((elapsedTime / (playingMeditation.duration_minutes * 60)) * 100, 100)}%`,
                  }}
                ></div>
              </div>
            </div>

            <Button
              variant="destructive"
              className="w-full"
              onClick={handleStopMeditation}
            >
              Stop Meditation
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Meditations Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {meditations.map((meditation) => (
          <Card
            key={meditation.id}
            className="overflow-hidden hover:shadow-lg transition-shadow flex flex-col"
          >
            <div className={`h-32 bg-gradient-to-br ${getMeditationContent(meditation.category).color} flex items-center justify-center`}>
              {getMeditationContent(meditation.category).icon && 
                React.createElement(getMeditationContent(meditation.category).icon, {
                  className: "h-12 w-12 text-white",
                })}
            </div>
            <CardHeader className="flex-1">
              <div className="flex items-start justify-between gap-2 mb-2">
                <CardTitle className="text-lg">{meditation.title}</CardTitle>
                <Badge variant="secondary">{meditation.category}</Badge>
              </div>
              <CardDescription className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4" />
                {meditation.duration_minutes} minutes
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <p className="text-sm text-muted-foreground line-clamp-2">{meditation.description}</p>
              <Button
                className="w-full"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleStartMeditation(meditation);
                }}
                disabled={playingId === meditation.id}
              >
                <Play className="h-4 w-4 mr-2" />
                {playingId === meditation.id ? "Playing..." : "Start Meditation"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default MeditationLibrary;
