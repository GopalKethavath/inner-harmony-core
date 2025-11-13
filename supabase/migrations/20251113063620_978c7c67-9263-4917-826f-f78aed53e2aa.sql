-- Add delete policy for moods table
CREATE POLICY "Users can delete own moods" 
ON public.moods 
FOR DELETE 
USING (auth.uid() = user_id);