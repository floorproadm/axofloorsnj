import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Header from "@/components/shared/Header";
import Footer from "@/components/shared/Footer";
import { Share2, Users, DollarSign, Copy, Check, Phone, Mail, Gift, Heart, Star } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const ReferralProgram = () => {
  const [copied, setCopied] = useState(false);
  
  const referralLink = "https://axofloors.com?ref=satisfied-customer";
  
  const handleCopyLink = () => {
    console.log('[Referral CTA] Copy referral link clicked');
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast({
      title: "Link Copied!",
      description: "Share this link with friends and start earning.",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReferFriend = () => {
    console.log('[Referral CTA] Refer a friend button clicked');
    // Open share dialog or mailto
    const subject = "Check out AXO Floors - Amazing Flooring Company!";
    const body = `I just had an incredible experience with AXO Floors and thought you'd love them too! They're the surgeons of wood floors and do amazing work.\n\nCheck them out: ${referralLink}\n\nThanks!\n\nP.S. If you hire them, we both benefit from their referral program!`;
    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  };

  return (
    <div className="min-h-screen">
      <Header />
      
      {/* Hero Section */}
      <section className="py-12 sm:py-20 navy-gradient text-white">
        <div className="container mx-auto px-4 text-center">
          <div className="w-20 h-20 bg-gold/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Gift className="w-10 h-10 text-gold" />
          </div>
          
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold font-heading mb-4">
            Refer & Earn 7-10%
          </h1>
          
          <p className="text-lg sm:text-xl text-white/80 max-w-3xl mx-auto mb-8">
            Happy with your floors? Let others experience it too — and earn 7-10% of every project you refer.
          </p>
          
          <div className="flex items-center justify-center gap-2 text-gold">
            <Heart className="w-5 h-5 fill-gold" />
            <span className="font-medium">We'll treat your referrals like VIPs</span>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold font-heading text-navy mb-4">
              How It Works
            </h2>
            <p className="text-lg text-grey max-w-2xl mx-auto">
              Three simple steps to start earning 7-10% commission. Your friends get perfect floors. You get paid.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {/* Step 1 */}
            <Card className="text-center border-2 border-gold/20 hover:shadow-gold transition-smooth">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Share2 className="w-8 h-8 text-gold" />
                </div>
                <div className="w-8 h-8 bg-gold text-black rounded-full flex items-center justify-center font-bold text-lg mx-auto mb-4">
                  1
                </div>
                <h3 className="text-xl font-heading font-semibold text-navy mb-4">
                  Share Your Link
                </h3>
                <p className="text-grey leading-relaxed">
                  Copy your unique referral link and share it with friends, family, or anyone who needs beautiful floors.
                </p>
              </CardContent>
            </Card>

            {/* Step 2 */}
            <Card className="text-center border-2 border-gold/20 hover:shadow-gold transition-smooth">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Users className="w-8 h-8 text-gold" />
                </div>
                <div className="w-8 h-8 bg-gold text-black rounded-full flex items-center justify-center font-bold text-lg mx-auto mb-4">
                  2
                </div>
                <h3 className="text-xl font-heading font-semibold text-navy mb-4">
                  They Sign Up
                </h3>
                <p className="text-grey leading-relaxed">
                  When someone clicks your link and hires us for their project, we track it back to you automatically.
                </p>
              </CardContent>
            </Card>

            {/* Step 3 */}
            <Card className="text-center border-2 border-gold/20 hover:shadow-gold transition-smooth">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <DollarSign className="w-8 h-8 text-gold" />
                </div>
                <div className="w-8 h-8 bg-gold text-black rounded-full flex items-center justify-center font-bold text-lg mx-auto mb-4">
                  3
                </div>
                <h3 className="text-xl font-heading font-semibold text-navy mb-4">
                  Get Paid
                </h3>
                <p className="text-grey leading-relaxed">
                  Receive 7-10% of the total project value once their project is completed. No limits, no caps.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* CTA Buttons */}
          <div className="text-center space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
              <Button 
                onClick={handleCopyLink}
                className="gold-gradient text-black font-semibold flex-1 h-12"
              >
                {copied ? <Check className="w-5 h-5 mr-2" /> : <Copy className="w-5 h-5 mr-2" />}
                {copied ? "Link Copied!" : "Copy My Link"}
              </Button>
              <Button 
                onClick={handleReferFriend}
                variant="outline" 
                className="flex-1 h-12 hover:bg-gold hover:text-black hover:border-gold"
              >
                <Share2 className="w-5 h-5 mr-2" />
                Refer a Friend Now
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 bg-grey-light">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Benefits List */}
            <div>
              <h2 className="text-3xl md:text-4xl font-bold font-heading text-navy mb-8">
                Why Our Referral Program Works
              </h2>
              
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-gold rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="w-5 h-5 text-black" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-navy mb-2">High Commission Earnings</h3>
                    <p className="text-grey">Get 7-10% of the total project value for every successful referral — no limits, no caps.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-gold rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="w-5 h-5 text-black" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-navy mb-2">VIP Treatment</h3>
                    <p className="text-grey">Your referrals get priority scheduling and the same exceptional service you experienced.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-gold rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="w-5 h-5 text-black" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-navy mb-2">Easy Tracking</h3>
                    <p className="text-grey">We handle all the tracking automatically — just share your link and earn.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-gold rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="w-5 h-5 text-black" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-navy mb-2">Quick Payments</h3>
                    <p className="text-grey">Get paid within 30 days of project completion via check or direct deposit.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Example Earnings */}
            <Card className="border-2 border-gold/20">
              <CardHeader>
                <CardTitle className="text-2xl font-heading text-navy flex items-center gap-2">
                  <DollarSign className="w-6 h-6 text-gold" />
                  Earnings Examples
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-gold/5 rounded-lg">
                    <div>
                      <p className="font-medium text-navy">$5,000 Refinishing Project</p>
                      <p className="text-sm text-grey">Your friend saves their floors</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-gold">$350-500</p>
                      <p className="text-sm text-grey">Your earning (7-10%)</p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center p-4 bg-gold/5 rounded-lg">
                    <div>
                      <p className="font-medium text-navy">$12,000 New Installation</p>
                      <p className="text-sm text-grey">Your neighbor gets dream floors</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-gold">$840-1,200</p>
                      <p className="text-sm text-grey">Your earning (7-10%)</p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center p-4 bg-gold/5 rounded-lg">
                    <div>
                      <p className="font-medium text-navy">$25,000 Whole House Project</p>
                      <p className="text-sm text-grey">Your family gets stunning floors</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-gold">$1,750-2,500</p>
                      <p className="text-sm text-grey">Your earning (7-10%)</p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-navy text-white rounded-lg text-center">
                  <p className="text-gold font-semibold">Real Example: Designer earned $880 in June</p>
                  <p className="text-white/80">Just two referrals - your earnings add up quickly!</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold font-heading text-navy mb-8">
            Questions About Our Referral Program?
          </h2>
          
          <p className="text-lg text-grey max-w-2xl mx-auto mb-8">
            We're here to help you start earning from your referrals. Reach out anytime.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-md mx-auto">
            <Button variant="outline" className="h-12 hover:bg-gold hover:text-black hover:border-gold" asChild>
              <a href="tel:(732) 351-8653" className="flex items-center justify-center gap-2">
                <Phone className="w-5 h-5" />
                Call Us
              </a>
            </Button>
            <Button variant="outline" className="h-12 hover:bg-gold hover:text-black hover:border-gold" asChild>
              <a href="mailto:axofloorsnj@gmail.com" className="flex items-center justify-center gap-2">
                <Mail className="w-5 h-5" />
                Email Us
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-grey-light">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold font-heading text-navy mb-12">
            Happy Customers, Happy Referrers
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="border-2 border-gold/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-gold text-gold" />
                  ))}
                </div>
                <p className="text-grey mb-4 leading-relaxed italic">
                  "I've referred 3 families to AXO Floors and earned over $2,800. Everyone loves their work, and I love the substantial income!"
                </p>
                <p className="font-heading font-semibold text-navy">
                  - Sarah T.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-gold/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-gold text-gold" />
                  ))}
                </div>
                <p className="text-grey mb-4 leading-relaxed italic">
                  "Best referral program I've seen - 8% commission! My neighbor got amazing floors and I got a $960 check. Win-win!"
                </p>
                <p className="font-heading font-semibold text-navy">
                  - Mike R.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ReferralProgram;