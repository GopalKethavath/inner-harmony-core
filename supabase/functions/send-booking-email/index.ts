import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface BookingEmailRequest {
  therapistName: string;
  bookingDate: string;
  jitsiRoomCode: string;
  userName: string;
  userEmail: string;
}

const NOTIFICATION_EMAILS = [
  "gopalnayakkethavath426@mail.com",
  "gopalnayak5603@gmail.com",
  "gopal.kethavath@ncompasbusiness.com"
];

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { therapistName, bookingDate, jitsiRoomCode, userName, userEmail }: BookingEmailRequest = await req.json();

    const formattedDate = new Date(bookingDate).toLocaleString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });

    const jitsiLink = `https://meet.jit.si/${jitsiRoomCode}`;

    // Send to notification emails
    const notificationPromises = NOTIFICATION_EMAILS.map(email => 
      resend.emails.send({
        from: "MindCare <onboarding@resend.dev>",
        to: [email],
        subject: `New Therapy Booking - ${userName}`,
        html: `
          <h1>New Therapy Booking</h1>
          <p><strong>Patient:</strong> ${userName} (${userEmail})</p>
          <p><strong>Therapist:</strong> ${therapistName}</p>
          <p><strong>Date & Time:</strong> ${formattedDate}</p>
          <p><strong>Video Link:</strong> <a href="${jitsiLink}">${jitsiLink}</a></p>
          <p>Please ensure you're available for this session.</p>
        `,
      })
    );

    // Send to user
    const userEmailPromise = resend.emails.send({
      from: "MindCare <onboarding@resend.dev>",
      to: [userEmail],
      subject: "Your Therapy Session is Confirmed",
      html: `
        <h1>Your therapy session is confirmed!</h1>
        <p><strong>Therapist:</strong> ${therapistName}</p>
        <p><strong>Date & Time:</strong> ${formattedDate}</p>
        <p><strong>Video Link:</strong> <a href="${jitsiLink}">Join Session</a></p>
        <p>Please join the session at the scheduled time using the link above.</p>
        <p>Best regards,<br>The MindCare Team</p>
      `,
    });

    await Promise.all([...notificationPromises, userEmailPromise]);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error sending booking email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
