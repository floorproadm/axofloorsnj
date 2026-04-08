import { useState, useEffect, useRef } from "react";
import { Star, Copy, ExternalLink, MessageCircle, Camera, Gift, Phone, ChevronRight, CheckCircle2, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/shared/Header";
import Footer from "@/components/shared/Footer";
import { toast } from "sonner";
import { Link } from "react-router-dom";

// ── Configurable Links ──
const GOOGLE_REVIEW_URL = "https://g.page/r/CQkN6_example/review"; // Replace with real link
const HOUZZ_URL = "https://www.houzz.com/pro/axofloors";
const FACEBOOK_URL = "https://www.facebook.com/axofloors/reviews";
const INSTAGRAM_HANDLE = "@axofloors";
const EDUARDO_PHONE = "(862) 218-4496";

// ── Draft Templates ──
const SERVICE_OPTIONS = [
  { value: "refinishing", label: "Sanding & Refinishing" },
  { value: "installation", label: "Hardwood Installation" },
  { value: "vinyl", label: "Vinyl Plank Flooring" },
  { value: "staircase", label: "Staircase Refinishing" },
  { value: "repair", label: "Floor Repair" },
];

const HIGHLIGHT_OPTIONS = [
  { value: "quality", label: "Quality of Work" },
  { value: "clean", label: "Cleanliness & Care" },
  { value: "punctual", label: "Punctuality & Communication" },
  { value: "transform", label: "Amazing Transformation" },
  { value: "value", label: "Great Value" },
];

function generateDraft(service: string, highlight: string, name: string, city: string): string {
  const serviceLabel = SERVICE_OPTIONS.find(s => s.value === service)?.label || "flooring project";
  const highlightMap: Record<string, string> = {
    quality: "The quality of craftsmanship was outstanding — every detail was perfect.",
    clean: "The crew was incredibly clean and careful with our home throughout the entire process.",
    punctual: "Communication was excellent from start to finish, and they were always on time.",
    transform: "The transformation was absolutely amazing — our floors look brand new!",
    value: "The value we received was exceptional — high-quality work at a fair price.",
  };
  const highlightText = highlightMap[highlight] || highlightMap.quality;
  const nameCity = [name, city].filter(Boolean).join(", ");
  const signature = nameCity ? `\n\n— ${nameCity}` : "";

  return `We recently had AXO Floors do our ${serviceLabel.toLowerCase()} and couldn't be happier with the results. ${highlightText}\n\nEduardo and his team were professional, knowledgeable, and truly passionate about their craft. We highly recommend AXO Floors to anyone looking for top-quality flooring work in New Jersey.${signature}`;
}

// ── ScrollReveal ──
function ScrollReveal({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.15 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} className={`transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"} ${className}`}>
      {children}
    </div>
  );
}

export default function ReviewRequest() {
  const [service, setService] = useState("refinishing");
  const [highlight, setHighlight] = useState("quality");
  const [customerName, setCustomerName] = useState("");
  const [customerCity, setCustomerCity] = useState("");
  const draft = generateDraft(service, highlight, customerName, customerCity);

  const copyDraft = async () => {
    try {
      await navigator.clipboard.writeText(draft);
      toast.success("Review draft copied to clipboard!");
    } catch {
      const ta = document.createElement("textarea");
      ta.value = draft;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      toast.success("Review draft copied!");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* ── Hero ── */}
      <section className="relative py-20 md:py-28 bg-primary text-primary-foreground overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(var(--gold-accent)/0.08),transparent_60%)]" />
        <div className="container mx-auto px-4 relative z-10 text-center max-w-3xl">
          <ScrollReveal>
            <Badge className="bg-accent/20 text-accent border-accent/30 mb-6 text-sm">
              <CheckCircle2 className="w-4 h-4 mr-1" /> Project Complete
            </Badge>
            <h1 className="text-3xl md:text-5xl font-heading font-bold mb-6 leading-tight">
              Thank You for Choosing<br />
              <span className="text-accent">AXO Floors</span>
            </h1>
            <p className="text-lg md:text-xl text-primary-foreground/80 mb-8 leading-relaxed">
              Your satisfaction means everything to us. If you're happy with our work, a review helps other homeowners find quality flooring services they can trust.
            </p>
          </ScrollReveal>

          {/* Eduardo personal note */}
          <ScrollReveal>
            <div className="bg-primary-foreground/5 border border-primary-foreground/10 rounded-2xl p-6 md:p-8 text-left max-w-2xl mx-auto">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                  <Heart className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <p className="text-primary-foreground/90 text-sm md:text-base leading-relaxed italic">
                    "Every floor we touch is personal to us. If we delivered a great experience, sharing your story helps other families find the same care for their homes. It takes just 2 minutes and means the world to our small team."
                  </p>
                  <p className="text-accent font-semibold mt-3 text-sm">— Eduardo, Founder of AXO Floors</p>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ── Platform Cards ── */}
      <section className="py-16 md:py-20 bg-secondary">
        <div className="container mx-auto px-4 max-w-5xl">
          <ScrollReveal>
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-heading font-bold text-foreground mb-3">
                Leave Your Review
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Choose your preferred platform — Google reviews help us the most!
              </p>
            </div>
          </ScrollReveal>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Google — Preferred */}
            <ScrollReveal>
              <Card className="border-2 border-accent/40 relative overflow-hidden hover:shadow-lg transition-shadow">
                <div className="absolute top-0 left-0 right-0 h-1 bg-accent" />
                <Badge className="absolute top-3 right-3 bg-accent text-accent-foreground text-xs">
                  <Star className="w-3 h-3 mr-1" /> Preferred
                </Badge>
                <CardContent className="p-6 pt-8 text-center">
                  <div className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
                    <Star className="w-7 h-7 text-accent" />
                  </div>
                  <h3 className="font-heading font-bold text-lg mb-2">Google</h3>
                  <p className="text-muted-foreground text-sm mb-4">Most impactful for local visibility</p>
                  <Button asChild className="w-full bg-primary hover:bg-primary/90">
                    <a href={GOOGLE_REVIEW_URL} target="_blank" rel="noopener noreferrer">
                      Review on Google <ExternalLink className="w-4 h-4 ml-1" />
                    </a>
                  </Button>
                </CardContent>
              </Card>
            </ScrollReveal>

            {/* Houzz */}
            <ScrollReveal>
              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6 pt-8 text-center">
                  <div className="w-14 h-14 rounded-xl bg-green-100 flex items-center justify-center mx-auto mb-4">
                    <Star className="w-7 h-7 text-green-600" />
                  </div>
                  <h3 className="font-heading font-bold text-lg mb-2">Houzz</h3>
                  <p className="text-muted-foreground text-sm mb-4">Great for home renovation audiences</p>
                  <Button asChild variant="outline" className="w-full">
                    <a href={HOUZZ_URL} target="_blank" rel="noopener noreferrer">
                      Review on Houzz <ExternalLink className="w-4 h-4 ml-1" />
                    </a>
                  </Button>
                </CardContent>
              </Card>
            </ScrollReveal>

            {/* Facebook */}
            <ScrollReveal>
              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6 pt-8 text-center">
                  <div className="w-14 h-14 rounded-xl bg-blue-100 flex items-center justify-center mx-auto mb-4">
                    <Star className="w-7 h-7 text-blue-600" />
                  </div>
                  <h3 className="font-heading font-bold text-lg mb-2">Facebook</h3>
                  <p className="text-muted-foreground text-sm mb-4">Share with friends and community</p>
                  <Button asChild variant="outline" className="w-full">
                    <a href={FACEBOOK_URL} target="_blank" rel="noopener noreferrer">
                      Review on Facebook <ExternalLink className="w-4 h-4 ml-1" />
                    </a>
                  </Button>
                </CardContent>
              </Card>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ── How-To Steps (Google) ── */}
      <section className="py-16 md:py-20 bg-background">
        <div className="container mx-auto px-4 max-w-3xl">
          <ScrollReveal>
            <h2 className="text-2xl md:text-3xl font-heading font-bold text-foreground text-center mb-10">
              How to Leave a Google Review
            </h2>
          </ScrollReveal>

          <div className="space-y-4">
            {[
              { step: 1, title: "Click the Google button above", desc: "It will open Google Maps with our business page" },
              { step: 2, title: "Sign in to your Google account", desc: "Use any Gmail or Google account you have" },
              { step: 3, title: "Select your star rating", desc: "Tap the stars — we aim for 5 ⭐ but appreciate honest feedback" },
              { step: 4, title: "Write a few words & submit", desc: "Use our draft generator below for inspiration, or write your own!" },
            ].map(({ step, title, desc }) => (
              <ScrollReveal key={step}>
                <div className="flex items-start gap-4 p-4 rounded-xl bg-secondary/50 border border-border">
                  <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm flex-shrink-0">
                    {step}
                  </div>
                  <div>
                    <h3 className="font-heading font-semibold text-foreground">{title}</h3>
                    <p className="text-muted-foreground text-sm">{desc}</p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Draft Generator ── */}
      <section className="py-16 md:py-20 bg-secondary">
        <div className="container mx-auto px-4 max-w-4xl">
          <ScrollReveal>
            <div className="text-center mb-10">
              <h2 className="text-2xl md:text-3xl font-heading font-bold text-foreground mb-3">
                Review Draft Generator
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Not sure what to write? Select your options and we'll create a personalized draft you can copy and paste.
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal>
            <Card className="overflow-hidden">
              <CardContent className="p-6 md:p-8">
                <div className="grid md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Service Type</label>
                    <Select value={service} onValueChange={setService}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {SERVICE_OPTIONS.map(o => (
                          <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">What Stood Out</label>
                    <Select value={highlight} onValueChange={setHighlight}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {HIGHLIGHT_OPTIONS.map(o => (
                          <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Your Name <span className="text-muted-foreground">(optional)</span></label>
                    <Input placeholder="John D." value={customerName} onChange={e => setCustomerName(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">City <span className="text-muted-foreground">(optional)</span></label>
                    <Input placeholder="Morristown, NJ" value={customerCity} onChange={e => setCustomerCity(e.target.value)} />
                  </div>
                </div>

                {/* Preview */}
                <div className="bg-secondary/70 rounded-xl p-5 mb-5 border border-border">
                  <div className="flex items-center gap-1 mb-3">
                    {[1, 2, 3, 4, 5].map(i => (
                      <Star key={i} className="w-5 h-5 fill-accent text-accent" />
                    ))}
                  </div>
                  <p className="text-foreground text-sm leading-relaxed whitespace-pre-line">{draft}</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button onClick={copyDraft} className="flex-1 bg-primary hover:bg-primary/90">
                    <Copy className="w-4 h-4 mr-2" /> Copy Draft
                  </Button>
                  <Button asChild variant="outline" className="flex-1 border-accent text-accent hover:bg-accent/10">
                    <a href={GOOGLE_REVIEW_URL} target="_blank" rel="noopener noreferrer">
                      Open Google Review <ExternalLink className="w-4 h-4 ml-1" />
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </ScrollReveal>
        </div>
      </section>

      {/* ── Share Photos ── */}
      <section className="py-16 md:py-20 bg-background">
        <div className="container mx-auto px-4 max-w-4xl">
          <ScrollReveal>
            <div className="text-center mb-10">
              <h2 className="text-2xl md:text-3xl font-heading font-bold text-foreground mb-3">
                Share Your Before & After
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Got photos of the transformation? We'd love to feature your project!
              </p>
            </div>
          </ScrollReveal>

          <div className="grid md:grid-cols-2 gap-6">
            <ScrollReveal>
              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6 text-center">
                  <div className="w-14 h-14 rounded-xl bg-green-100 flex items-center justify-center mx-auto mb-4">
                    <MessageCircle className="w-7 h-7 text-green-600" />
                  </div>
                  <h3 className="font-heading font-bold text-lg mb-2">Send via WhatsApp / Text</h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    Text your before & after photos directly to Eduardo
                  </p>
                  <Button asChild variant="outline" className="w-full">
                    <a href={`sms:${EDUARDO_PHONE}?body=Here%20are%20my%20before%20%26%20after%20photos!`}>
                      <Camera className="w-4 h-4 mr-2" /> Send Photos
                    </a>
                  </Button>
                </CardContent>
              </Card>
            </ScrollReveal>

            <ScrollReveal>
              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6 text-center">
                  <div className="w-14 h-14 rounded-xl bg-pink-100 flex items-center justify-center mx-auto mb-4">
                    <Camera className="w-7 h-7 text-pink-600" />
                  </div>
                  <h3 className="font-heading font-bold text-lg mb-2">Tag Us on Instagram</h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    Post your photos and tag <span className="font-semibold text-foreground">{INSTAGRAM_HANDLE}</span>
                  </p>
                  <Button asChild variant="outline" className="w-full">
                    <a href="https://www.instagram.com/axofloors" target="_blank" rel="noopener noreferrer">
                      Open Instagram <ExternalLink className="w-4 h-4 ml-1" />
                    </a>
                  </Button>
                </CardContent>
              </Card>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ── Referral CTA ── */}
      <section className="py-16 md:py-20 bg-secondary">
        <div className="container mx-auto px-4 max-w-3xl">
          <ScrollReveal>
            <Card className="border-accent/20 overflow-hidden">
              <CardContent className="p-8 md:p-10 text-center">
                <div className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
                  <Gift className="w-7 h-7 text-accent" />
                </div>
                <h2 className="text-2xl md:text-3xl font-heading font-bold text-foreground mb-3">
                  Know Someone Who Needs New Floors?
                </h2>
                <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
                  Refer a friend, neighbor, or family member and earn rewards through our referral program.
                </p>
                <div className="flex flex-wrap gap-2 justify-center mb-6">
                  {["Homeowners", "Realtors", "Property Managers", "Builders"].map(tag => (
                    <Badge key={tag} variant="outline" className="border-accent/30 text-foreground">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
                  <Link to="/referral-program">
                    Learn About Referrals <ChevronRight className="w-4 h-4 ml-1" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </ScrollReveal>
        </div>
      </section>

      {/* ── Contact Eduardo ── */}
      <section className="py-16 md:py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 max-w-2xl text-center">
          <ScrollReveal>
            <h2 className="text-2xl md:text-3xl font-heading font-bold mb-4">
              Questions? Reach Out Directly
            </h2>
            <p className="text-primary-foreground/70 mb-8">
              Eduardo is always available for follow-ups, touch-ups, or your next project.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
                <a href={`tel:${EDUARDO_PHONE}`}>
                  <Phone className="w-4 h-4 mr-2" /> Call Eduardo
                </a>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
                <a href={`sms:${EDUARDO_PHONE}`}>
                  <MessageCircle className="w-4 h-4 mr-2" /> Text Eduardo
                </a>
              </Button>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <Footer />
    </div>
  );
}
