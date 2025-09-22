import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Star, Send, CheckCircle, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ReviewFormData {
  customerName: string;
  customerEmail: string;
  projectType: string;
  rating: number;
  reviewText: string;
  customerPhone: string;
}

const AutomatedReviewSystem = () => {
  const [reviewData, setReviewData] = useState<ReviewFormData>({
    customerName: '',
    customerEmail: '',
    projectType: '',
    rating: 5,
    reviewText: '',
    customerPhone: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const { toast } = useToast();

  const projectTypes = [
    'Hardwood Floor Installation',
    'Floor Refinishing',
    'Floor Sanding',
    'Vinyl Plank Installation',
    'Staircase Renovation',
    'Floor Repair',
    'Complete Home Flooring'
  ];

  const handleRatingChange = (rating: number) => {
    setReviewData(prev => ({ ...prev, rating }));
  };

  const handleInputChange = (field: keyof ReviewFormData, value: string) => {
    setReviewData(prev => ({ ...prev, [field]: value }));
  };

  const generateReviewRequest = async () => {
    setIsSubmitting(true);
    
    try {
      // Save review request to database for follow-up
      const { error } = await supabase
        .from('leads')
        .insert([{
          name: reviewData.customerName,
          email: reviewData.customerEmail,
          phone: reviewData.customerPhone,
          lead_source: 'review_system',
          status: 'new',
          priority: 'medium',
          services: [reviewData.projectType],
          room_size: 'Review Request',
          budget: 0,
          message: 'Review request generated automatically'
        }]);

      if (error) throw error;

      // Send automated review request email
      const { error: emailError } = await supabase.functions.invoke('send-notifications', {
        body: {
          leadData: {
            name: reviewData.customerName,
            email: reviewData.customerEmail,
            phone: reviewData.customerPhone,
            services: [reviewData.projectType],
            source: 'review_request'
          },
          adminEmail: 'axofloorsnj@gmail.com',
          reviewRequest: true,
          googleReviewLink: 'https://search.google.com/local/writereview?placeid=ChIJExample'
        }
      });

      if (emailError) {
        console.error('Email error:', emailError);
      }

      setShowSuccess(true);
      toast({
        title: "Review request sent!",
        description: "The customer will receive an email with links to leave reviews on Google and other platforms."
      });

    } catch (error) {
      console.error('Error sending review request:', error);
      toast({
        title: "Error",
        description: "Failed to send review request. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickReview = () => {
    const googleReviewUrl = `https://search.google.com/local/writereview?placeid=ChIJExample`;
    const facebookReviewUrl = `https://www.facebook.com/axofloorsnj/reviews`;
    
    // Open multiple review platforms
    window.open(googleReviewUrl, '_blank');
    
    toast({
      title: "Thank you!",
      description: "Your review helps us serve more families in New Jersey!"
    });
  };

  if (showSuccess) {
    return (
      <Card className="bg-green-50 border-green-200">
        <CardContent className="p-6 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-green-800 mb-2">
            Review Request Sent Successfully!
          </h3>
          <p className="text-green-700 mb-4">
            The customer will receive an automated email with direct links to leave reviews on Google and other platforms.
          </p>
          <Button
            onClick={() => {
              setShowSuccess(false);
              setReviewData({
                customerName: '',
                customerEmail: '',
                projectType: '',
                rating: 5,
                reviewText: '',
                customerPhone: ''
              });
            }}
            variant="outline"
            className="border-green-500 text-green-700 hover:bg-green-100"
          >
            Send Another Request
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quick Review Section */}
      <Card className="bg-gold/5 border-gold/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-navy">
            <Star className="w-5 h-5 text-gold" />
            Leave a Quick Review
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-grey mb-4">
            Had a great experience with AXO Floors? Share it with others and help us grow!
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleQuickReview}
              className="gold-gradient text-black font-semibold flex-1"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Review on Google
            </Button>
            <Button
              onClick={() => window.open('https://www.facebook.com/axofloorsnj/reviews', '_blank')}
              variant="outline"
              className="flex-1"
            >
              Review on Facebook
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Automated Review Request System */}
      <Card>
        <CardHeader>
          <CardTitle className="text-navy">
            Send Automated Review Request
          </CardTitle>
          <p className="text-grey">
            Send personalized review requests to completed project customers
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="customerName">Customer Name *</Label>
              <Input
                id="customerName"
                value={reviewData.customerName}
                onChange={(e) => handleInputChange('customerName', e.target.value)}
                placeholder="John Smith"
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="customerEmail">Customer Email *</Label>
              <Input
                id="customerEmail"
                type="email"
                value={reviewData.customerEmail}
                onChange={(e) => handleInputChange('customerEmail', e.target.value)}
                placeholder="john@example.com"
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="customerPhone">Customer Phone</Label>
              <Input
                id="customerPhone"
                value={reviewData.customerPhone}
                onChange={(e) => handleInputChange('customerPhone', e.target.value)}
                placeholder="(732) 555-0123"
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="projectType">Project Type</Label>
              <select
                id="projectType"
                value={reviewData.projectType}
                onChange={(e) => handleInputChange('projectType', e.target.value)}
                className="mt-1 w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gold focus:border-gold"
              >
                <option value="">Select project type</option>
                {projectTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <Label>Expected Rating</Label>
            <div className="flex items-center gap-2 mt-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => handleRatingChange(star)}
                  className="focus:outline-none"
                >
                  <Star
                    className={`w-6 h-6 cursor-pointer transition-colors ${
                      star <= reviewData.rating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300 hover:text-yellow-200'
                    }`}
                  />
                </button>
              ))}
              <span className="ml-2 text-grey">({reviewData.rating} stars)</span>
            </div>
          </div>

          <div>
            <Label htmlFor="reviewText">Suggested Review Text (Optional)</Label>
            <Textarea
              id="reviewText"
              value={reviewData.reviewText}
              onChange={(e) => handleInputChange('reviewText', e.target.value)}
              placeholder="AXO Floors did an amazing job with our hardwood installation..."
              className="mt-1"
              rows={3}
            />
          </div>

          <Button
            onClick={generateReviewRequest}
            disabled={isSubmitting || !reviewData.customerName || !reviewData.customerEmail}
            className="w-full gold-gradient text-black font-semibold"
          >
            {isSubmitting ? (
              "Sending Request..."
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Send Review Request
              </>
            )}
          </Button>

          <p className="text-xs text-grey text-center">
            This will send an automated email with direct links to Google Reviews, Facebook, and other platforms.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AutomatedReviewSystem;