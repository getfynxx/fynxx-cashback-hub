import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  email: string;
  status: "approved" | "rejected";
  brandName: string;
  cashbackAmount?: number;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("send-notification function called");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, status, brandName, cashbackAmount }: NotificationRequest = await req.json();
    
    console.log(`Sending ${status} notification to ${email} for brand ${brandName}`);

    const isApproved = status === "approved";
    const subject = isApproved
      ? `Great news! Your ${brandName} submission was approved!`
      : `Update on your ${brandName} submission`;

    const html = isApproved
      ? `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #10b981;">Congratulations! 🎉</h1>
          <p>Your content submission for <strong>${brandName}</strong> has been approved!</p>
          <p style="font-size: 24px; color: #10b981; font-weight: bold;">₹${cashbackAmount} has been added to your wallet.</p>
          <p>Log in to your FYNXX dashboard to see your updated balance.</p>
          <p style="color: #666; margin-top: 32px;">Thank you for being part of the FYNXX community!</p>
        </div>
      `
      : `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #ef4444;">Submission Update</h1>
          <p>Unfortunately, your content submission for <strong>${brandName}</strong> was not approved.</p>
          <p>This could be due to the content not meeting our guidelines. Feel free to submit new content anytime!</p>
          <p style="color: #666; margin-top: 32px;">Thank you for being part of the FYNXX community.</p>
        </div>
      `;

    const emailResponse = await resend.emails.send({
      from: "FYNXX <onboarding@resend.dev>",
      to: [email],
      subject,
      html,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-notification function:", error);
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
