import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Video, User, Trash2, Edit } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface Therapist {
  id: string;
  name: string;
  specialization: string;
  bio: string | null;
  avatar_url: string | null;
  email: string;
}

interface Booking {
  id: string;
  booking_date: string;
  jitsi_room_code: string;
  status: string;
  therapists: {
    name: string;
  };
}

interface TherapistBookingProps {
  userId: string;
}

const TherapistBooking = ({ userId }: TherapistBookingProps) => {
  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedTherapist, setSelectedTherapist] = useState<Therapist | null>(null);
  const [bookingDate, setBookingDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchTherapists();
    fetchBookings();
  }, [userId]);

  const fetchTherapists = async () => {
    const { data, error } = await supabase
      .from("therapists")
      .select("*")
      .order("name");

    if (!error && data) {
      setTherapists(data);
    }
  };

  const fetchBookings = async () => {
    const { data, error } = await supabase
      .from("bookings")
      .select(`
        *,
        therapists (name)
      `)
      .eq("user_id", userId)
      .order("booking_date", { ascending: false });

    if (!error && data) {
      setBookings(data as any);
    }
  };

  const handleBooking = async () => {
    if (!selectedTherapist || !bookingDate) {
      toast({ title: "Please select a date", variant: "destructive" });
      return;
    }

    setLoading(true);
    const roomCode = `mindcare-${Date.now()}`;

    const { data: insertData, error } = await supabase.from("bookings").insert({
      user_id: userId,
      therapist_id: selectedTherapist.id,
      booking_date: new Date(bookingDate).toISOString(),
      jitsi_room_code: roomCode,
      status: "scheduled",
    }).select();

    if (error) {
      toast({ title: "Booking failed", description: error.message, variant: "destructive" });
    } else {
      // Get user email
      const { data: { user } } = await supabase.auth.getUser();
      
      // Send email notification
      if (user?.email) {
        await supabase.functions.invoke('send-booking-email', {
          body: {
            therapistName: selectedTherapist.name,
            bookingDate: new Date(bookingDate).toISOString(),
            jitsiRoomCode: roomCode,
            userName: user.user_metadata?.full_name || "User",
            userEmail: user.email,
          }
        });
      }
      
      toast({ title: "Session booked!", description: "Confirmation emails sent." });
      setSelectedTherapist(null);
      setBookingDate("");
      setIsDialogOpen(false);
      fetchBookings();
    }
    setLoading(false);
  };

  const handleEditBooking = async () => {
    if (!editingBooking || !bookingDate) {
      toast({ title: "Please select a date", variant: "destructive" });
      return;
    }

    setLoading(true);
    const { error } = await supabase
      .from("bookings")
      .update({ booking_date: new Date(bookingDate).toISOString() })
      .eq("id", editingBooking.id);

    if (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Booking updated successfully" });
      setEditingBooking(null);
      setBookingDate("");
      setIsDialogOpen(false);
      fetchBookings();
    }
    setLoading(false);
  };

  const handleDeleteBooking = async (bookingId: string) => {
    const { error } = await supabase
      .from("bookings")
      .delete()
      .eq("id", bookingId);

    if (error) {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Booking deleted successfully" });
      fetchBookings();
    }
  };

  const getJitsiLink = (roomCode: string) => `https://meet.jit.si/${roomCode}`;

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {therapists.map((therapist) => (
          <Card key={therapist.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">{therapist.name}</CardTitle>
                  <Badge variant="secondary" className="mt-1">
                    {therapist.specialization}
                  </Badge>
                </div>
              </div>
              <CardDescription>{therapist.bio || "Experienced therapist dedicated to your wellness"}</CardDescription>
            </CardHeader>
            <CardContent>
              <Dialog open={isDialogOpen && selectedTherapist?.id === therapist.id} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    className="w-full"
                    onClick={() => {
                      setSelectedTherapist(therapist);
                      setEditingBooking(null);
                      setBookingDate("");
                      setIsDialogOpen(true);
                    }}
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Book Session
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Book a session with {therapist.name}</DialogTitle>
                    <DialogDescription>Choose a date and time for your video session</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <Input
                      type="datetime-local"
                      value={bookingDate}
                      onChange={(e) => setBookingDate(e.target.value)}
                      min={new Date().toISOString().slice(0, 16)}
                    />
                    <Button onClick={handleBooking} disabled={loading} className="w-full">
                      {loading ? "Booking..." : "Confirm Booking"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        ))}
      </div>

      {bookings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Your Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {bookings.map((booking) => (
                <div key={booking.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                  <div className="flex-1">
                    <p className="font-medium">{booking.therapists.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(booking.booking_date).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge>{booking.status}</Badge>
                    <Button
                      size="sm"
                      onClick={() => window.open(getJitsiLink(booking.jitsi_room_code), "_blank")}
                    >
                      <Video className="h-4 w-4 mr-2" />
                      Join
                    </Button>
                    <Dialog open={isDialogOpen && editingBooking?.id === booking.id} onOpenChange={setIsDialogOpen}>
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingBooking(booking);
                            setBookingDate(new Date(booking.booking_date).toISOString().slice(0, 16));
                            setIsDialogOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Edit Booking</DialogTitle>
                          <DialogDescription>Update your session date and time</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <Input
                            type="datetime-local"
                            value={bookingDate}
                            onChange={(e) => setBookingDate(e.target.value)}
                            min={new Date().toISOString().slice(0, 16)}
                          />
                          <Button onClick={handleEditBooking} disabled={loading} className="w-full">
                            {loading ? "Updating..." : "Update Booking"}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteBooking(booking.id)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
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

export default TherapistBooking;
