import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Video, User, Trash2, Edit, Mail, Briefcase } from "lucide-react";
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
    email: string;
    specialization: string;
    avatar_url: string | null;
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
        therapists (name, email, specialization, avatar_url)
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
        {therapists.map((therapist, index) => {
          const colors = [
            { bg: "bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-950 dark:to-teal-900", icon: "bg-teal-500", badge: "bg-teal-200 dark:bg-teal-800" },
            { bg: "bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900", icon: "bg-purple-500", badge: "bg-purple-200 dark:bg-purple-800" },
            { bg: "bg-gradient-to-br from-coral-50 to-coral-100 dark:from-coral-950 dark:to-coral-900", icon: "bg-coral-500", badge: "bg-coral-200 dark:bg-coral-800" },
          ];
          const colorScheme = colors[index % colors.length];
          
          return (
            <Card key={therapist.id} className={`hover:shadow-xl transition-all duration-300 border-2 ${colorScheme.bg}`}>
              <CardHeader>
                <div className="flex items-start gap-3 mb-3">
                  <div className={`h-14 w-14 rounded-full ${colorScheme.icon} flex items-center justify-center flex-shrink-0`}>
                    <User className="h-7 w-7 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-xl mb-2">{therapist.name}</CardTitle>
                    <Badge className={`${colorScheme.badge} text-foreground border-0`}>
                      <Briefcase className="h-3 w-3 mr-1" />
                      {therapist.specialization}
                    </Badge>
                  </div>
                </div>
                <CardDescription className="text-sm line-clamp-2 mb-3">
                  {therapist.bio || "Experienced therapist dedicated to your wellness"}
                </CardDescription>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span className="truncate">{therapist.email}</span>
                </div>
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
          );
        })}
      </div>

      {bookings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Your Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {bookings.map((booking, index) => {
                const statusColors: Record<string, string> = {
                  scheduled: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
                  completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
                  cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
                };
                
                const cardColors = [
                  "bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-950 dark:to-cyan-950 border-teal-200 dark:border-teal-800",
                  "bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 border-purple-200 dark:border-purple-800",
                  "bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950 dark:to-orange-950 border-amber-200 dark:border-amber-800",
                ];
                
                return (
                  <div 
                    key={booking.id} 
                    className={`flex flex-col md:flex-row md:items-center justify-between p-5 rounded-xl border-2 ${cardColors[index % cardColors.length]} shadow-sm hover:shadow-md transition-all`}
                  >
                    <div className="flex-1 space-y-2 mb-4 md:mb-0">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold text-lg">{booking.therapists.name}</p>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Briefcase className="h-3 w-3" />
                            {booking.therapists.specialization}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground ml-13">
                        <Mail className="h-4 w-4" />
                        <span>{booking.therapists.email}</span>
                      </div>
                      <div className="flex items-center gap-2 ml-13">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <p className="text-sm font-medium">
                          {new Date(booking.booking_date).toLocaleString("en-US", {
                            weekday: "long",
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                    <Badge className={`${statusColors[booking.status] || statusColors.scheduled} border-0`}>
                      {booking.status}
                    </Badge>
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
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TherapistBooking;
