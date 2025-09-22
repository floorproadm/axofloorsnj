import { useState } from 'react';
import Header from '@/components/shared/Header';
import Footer from '@/components/shared/Footer';
import AutomatedReviewSystem from '@/components/shared/AutomatedReviewSystem';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Star, TrendingUp, Users, MessageSquare, BarChart3 } from 'lucide-react';

const ReviewManagement = () => {
  const [stats] = useState({
    totalReviews: 47,
    averageRating: 4.9,
    monthlyGrowth: '+12',
    responseRate: '95%'
  });

  const recentReviews = [
    {
      id: 1,
      name: 'Maria Santos',
      rating: 5,
      date: '2024-01-15',
      platform: 'Google',
      text: 'Exceptional work! AXO Floors transformed our old hardwood floors completely.',
      status: 'published'
    },
    {
      id: 2,
      name: 'John Mitchell',
      rating: 5,
      date: '2024-01-12',
      platform: 'Facebook',
      text: 'Outstanding service from start to finish. The new hardwood installation looks amazing.',
      status: 'published'
    },
    {
      id: 3,
      name: 'Lisa Rodriguez',
      rating: 5,
      date: '2024-01-10',
      platform: 'Google',
      text: 'AXO Floors saved our damaged floors! Professional service and beautiful results.',
      status: 'published'
    }
  ];

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
        }`}
      />
    ));
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold font-heading text-navy mb-4">
              Review Management System
            </h1>
            <p className="text-lg text-grey">
              Manage customer reviews, send automated requests, and track your online reputation.
            </p>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6 text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-gold/10 rounded-full mb-4 mx-auto">
                  <Star className="w-6 h-6 text-gold" />
                </div>
                <div className="text-2xl font-bold text-navy mb-1">{stats.averageRating}</div>
                <div className="text-sm text-grey">Average Rating</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-4 mx-auto">
                  <MessageSquare className="w-6 h-6 text-blue-600" />
                </div>
                <div className="text-2xl font-bold text-navy mb-1">{stats.totalReviews}</div>
                <div className="text-sm text-grey">Total Reviews</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-4 mx-auto">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
                <div className="text-2xl font-bold text-navy mb-1">{stats.monthlyGrowth}</div>
                <div className="text-sm text-grey">Monthly Growth</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mb-4 mx-auto">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
                <div className="text-2xl font-bold text-navy mb-1">{stats.responseRate}</div>
                <div className="text-sm text-grey">Response Rate</div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Tabs */}
          <Tabs defaultValue="send-requests" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="send-requests">Send Review Requests</TabsTrigger>
              <TabsTrigger value="recent-reviews">Recent Reviews</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="send-requests">
              <AutomatedReviewSystem />
            </TabsContent>

            <TabsContent value="recent-reviews">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Recent Customer Reviews
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentReviews.map((review) => (
                      <div key={review.id} className="border rounded-lg p-4 hover:bg-grey-light/50 transition-colors">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-semibold text-navy">{review.name}</h4>
                            <div className="flex items-center gap-2 text-sm text-grey">
                              <span>{review.platform}</span>
                              <span>•</span>
                              <span>{new Date(review.date).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            {renderStars(review.rating)}
                          </div>
                        </div>
                        <p className="text-grey mb-3">"{review.text}"</p>
                        <div className="flex items-center justify-between">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            review.status === 'published' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {review.status}
                          </span>
                          <Button variant="outline" size="sm">
                            Respond
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5" />
                      Platform Distribution  
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-grey">Google Reviews</span>
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-grey-light rounded-full">
                            <div className="w-20 h-2 bg-gold rounded-full"></div>
                          </div>
                          <span className="text-sm font-medium">85%</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-grey">Facebook Reviews</span>
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-grey-light rounded-full">
                            <div className="w-12 h-2 bg-blue-500 rounded-full"></div>
                          </div>
                          <span className="text-sm font-medium">15%</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button
                      onClick={() => window.open('https://business.google.com', '_blank')}
                      variant="outline"
                      className="w-full justify-start"
                    >
                      Manage Google Business Profile
                    </Button>
                    <Button
                      onClick={() => window.open('https://www.facebook.com/axofloorsnj', '_blank')}
                      variant="outline"  
                      className="w-full justify-start"
                    >
                      View Facebook Reviews
                    </Button>
                    <Button
                      onClick={() => window.open('https://search.google.com/local/writereview?placeid=ChIJExample', '_blank')}
                      className="w-full justify-start gold-gradient text-black"
                    >
                      Test Review Link
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ReviewManagement;