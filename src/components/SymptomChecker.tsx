import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, Sparkles } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface SymptomCheckerProps {
  userId: string;
}

const SymptomChecker = ({ userId }: SymptomCheckerProps) => {
  const [symptoms, setSymptoms] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleCheck = async () => {
    if (!symptoms.trim()) {
      toast({ title: "Please describe your symptoms", variant: "destructive" });
      return;
    }

    setLoading(true);
    setResponse("");

    try {
      const { data, error } = await supabase.functions.invoke("symptom-checker", {
        body: { symptoms: symptoms.trim() },
      });

      if (error) {
        if (error.message.includes("429")) {
          toast({
            title: "Rate Limit",
            description: "Too many requests. Please try again in a moment.",
            variant: "destructive",
          });
        } else if (error.message.includes("402")) {
          toast({
            title: "Service Unavailable",
            description: "AI service is temporarily unavailable.",
            variant: "destructive",
          });
        } else {
          throw error;
        }
        return;
      }

      if (data?.response) {
        setResponse(data.response);
        
        // Save to history
        await supabase.from("symptom_checks").insert({
          user_id: userId,
          symptoms: symptoms.trim(),
          ai_response: data.response,
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to analyze symptoms",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          This tool provides general guidance only. Always consult a licensed mental health professional for diagnosis and treatment.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Symptom Checker
          </CardTitle>
          <CardDescription>
            Describe what you're experiencing, and get compassionate guidance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Describe your symptoms, thoughts, or feelings..."
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
            className="min-h-[150px]"
          />
          <Button onClick={handleCheck} disabled={loading} className="w-full">
            {loading ? "Analyzing..." : "Get Guidance"}
          </Button>

          {response && (
            <Card className="bg-muted/50">
              <CardContent className="pt-6">
                <div className="prose prose-sm max-w-none">
                  <p className="whitespace-pre-wrap">{response}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SymptomChecker;
