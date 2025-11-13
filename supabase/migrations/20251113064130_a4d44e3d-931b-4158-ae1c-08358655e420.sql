-- Add delete policy for bookings table
CREATE POLICY "Users can delete own bookings" 
ON public.bookings 
FOR DELETE 
USING (auth.uid() = user_id);