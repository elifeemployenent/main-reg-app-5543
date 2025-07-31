import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import JobCardHighlight from '@/components/landing/JobCardHighlight';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Users, FileText, TrendingUp, Bell, Phone, Mail, MapPin, Youtube } from 'lucide-react';
const LandingPage = () => {
  const [announcements, setAnnouncements] = useState([]);

  // Fetch active announcements
  const {
    data: announcementsData
  } = useQuery({
    queryKey: ['announcements'],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from('announcements').select('*').eq('is_active', true).or('expiry_date.is.null,expiry_date.gt.now()').order('created_at', {
        ascending: false
      });
      if (error) throw error;
      return data;
    }
  });

  // Fetch active utilities (for agents button)
  const {
    data: utilitiesData
  } = useQuery({
    queryKey: ['utilities'],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from('utilities').select('*').eq('is_active', true).order('created_at', {
        ascending: false
      }).limit(1);
      if (error) throw error;
      return data;
    }
  });

  // Real-time updates for announcements
  useEffect(() => {
    const channel = supabase.channel('announcements-changes').on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'announcements'
    }, () => {
      // Refetch announcements on any change
      window.location.reload();
    }).subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
  return <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Navbar />
      
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-6 py-12">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            {/* Title */}
            <div className="space-y-4">
              <h1 className="text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold text-gray-900 leading-tight">
                E-life Society Self Employment Registration Portal
              </h1>
            </div>
            
            {/* Description */}
            <div className="space-y-6">
              <p className="text-sm md:text-base lg:text-lg text-gray-600 leading-relaxed max-w-2xl mx-auto">
                വിവിധ സ്വയം തൊഴിൽ അവസരങ്ങൾക്കായി രജിസ്റ്റർ ചെയ്യുകയും നിങ്ങളുടെ അപേക്ഷാ നില ട്രാക്ക് ചെയ്യുകയും ചെയ്യുക. ഭാവി കെട്ടിപ്പടുക്കുന്ന ആയിരക്കണക്കിന് സംരംഭകരോടൊപ്പം ചേരൂ.
              </p>
            </div>
            
            {/* Buttons */}
            <div className="pt-6 px-4">
              <div className="flex flex-col gap-3 max-w-sm mx-auto lg:max-w-none lg:flex-row lg:gap-4 lg:justify-center lg:max-w-3xl">
                <Link to="/categories" className="w-full lg:flex-1">
                  <Button 
                    size="lg" 
                    className="w-full min-h-11 px-4 py-2 text-xs sm:text-sm md:text-base font-semibold rounded-lg text-center leading-tight"
                  >
                    പുതുതായി രജിസ്ട്രേഷൻ ചെയ്യുക
                  </Button>
                </Link>
                
                <Link to="/status" className="w-full lg:flex-1">
                  <Button 
                    variant="secondary" 
                    size="lg" 
                    className="w-full min-h-11 px-4 py-2 text-xs sm:text-sm md:text-base font-semibold rounded-lg text-center leading-tight"
                  >
                    മൊബൈൽ നമ്പർ ചെക്ക് ചെയ്യുക
                  </Button>
                </Link>
                
                {utilitiesData && utilitiesData[0] && (
                  <a href={utilitiesData[0].url} target="_blank" rel="noopener noreferrer" className="w-full lg:flex-1">
                    <Button 
                      variant="outline" 
                      size="lg" 
                      className="w-full min-h-11 px-4 py-2 text-xs sm:text-sm md:text-base font-semibold rounded-lg border-2 border-green-600 text-green-600 hover:bg-green-600 hover:text-white text-center leading-tight"
                    >
                      സ്വയം തൊഴിൽ പദ്ധതി തിരഞ്ഞെടുക്കാൻ
                    </Button>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Job Card Special Offer */}
      <JobCardHighlight />

      {/* YouTube Videos Section */}
      {announcementsData && announcementsData.some(a => a.youtube_video_url) && <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 bg-gradient-to-r from-red-50 to-pink-50">
          <div className="flex items-center gap-2 mb-6 sm:mb-8">
            <Youtube className="h-6 w-6 sm:h-8 sm:w-8 text-red-600" />
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Program Videos</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {announcementsData.filter(announcement => announcement.youtube_video_url).map(announcement => {
          const videoId = announcement.youtube_video_url?.includes('youtube.com/watch?v=') ? announcement.youtube_video_url.split('watch?v=')[1]?.split('&')[0] : announcement.youtube_video_url?.includes('youtu.be/') ? announcement.youtube_video_url.split('youtu.be/')[1]?.split('?')[0] : null;
          return <Card key={announcement.id} className="overflow-hidden">
                    <div className="aspect-video">
                      {videoId ? <iframe width="100%" height="100%" src={`https://www.youtube.com/embed/${videoId}`} title={announcement.title} frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen /> : <div className="flex items-center justify-center h-full bg-gray-100">
                          <Youtube className="h-12 w-12 text-gray-400" />
                        </div>}
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-lg mb-2">{announcement.title}</h3>
                      <p className="text-gray-600 text-sm">{announcement.content}</p>
                    </CardContent>
                  </Card>;
        })}
          </div>
        </div>}

      {/* Announcements Section */}
      {announcementsData && announcementsData.length > 0 && <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 bg-yellow-200">
          <div className="flex items-center gap-2 mb-4 sm:mb-6">
            <Bell className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Live Announcements</h2>
          </div>
          <div className="space-y-3 sm:space-y-4">
            {announcementsData.map(announcement => <Alert key={announcement.id} className="border-blue-200 bg-lime-100">
                <Bell className="h-4 w-4 text-blue-600" />
                <AlertDescription>
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="flex-1">
                      <h3 className="mb-1 text-lg sm:text-xl font-bold text-amber-600">{announcement.title}</h3>
                      <p className="text-blue-800 mb-2 text-sm sm:text-base">{announcement.content}</p>
                      {/* Display poster image if available */}
                      {announcement.poster_image_url && <div className="mb-2">
                          <img src={announcement.poster_image_url} alt={`${announcement.title} poster`} className="w-full max-w-xs sm:max-w-sm max-h-32 object-contain border rounded" onError={e => {
                    e.currentTarget.style.display = 'none';
                  }} />
                        </div>}
                    </div>
                    {announcement.expiry_date && <Badge variant="outline" className="text-xs self-start">
                        Expires: {new Date(announcement.expiry_date).toLocaleDateString()}
                      </Badge>}
                  </div>
                </AlertDescription>
              </Alert>)}
          </div>
        </div>}

      {/* Stats Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
          <Card className="text-center">
            <CardHeader>
              <Users className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <CardTitle className="text-3xl font-bold text-gray-900">5,000+</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Registered Users</p>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardHeader>
              <FileText className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <CardTitle className="text-3xl font-bold text-gray-900">7</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Available Categories</p>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardHeader>
              <TrendingUp className="h-12 w-12 text-purple-600 mx-auto mb-4" />
              <CardTitle className="text-3xl font-bold text-gray-900">98%</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Approval Rate</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Featured Self-Employment Opportunities */}
      <div className="bg-gradient-to-br from-amber-50 to-orange-100 py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-2 rounded-full text-sm font-semibold mb-4">
              🔥 HOT OPPORTUNITIES
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">
              Most In-Demand Self-Employment Categories
            </h2>
            <p className="text-base sm:text-lg text-gray-600 px-4">
              High-earning opportunities with guaranteed market demand and government support
            </p>
          </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          <Card className="bg-gradient-to-br from-pink-50 to-rose-100 border-pink-200">
            <CardHeader>
              <CardTitle className="text-xl text-pink-800">Tailoring & Fashion</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-pink-700">Start your own tailoring business with government support and training programs.</p>
              <div className="mt-4 p-3 bg-pink-100 rounded-lg">
                <p className="text-sm text-pink-800 font-medium">Average Monthly Income: ₹15,000 - ₹25,000</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-purple-50 to-violet-100 border-purple-200">
            <CardHeader>
              <CardTitle className="text-xl text-purple-800">Home Food Services</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-purple-700">Transform your cooking skills into a profitable home-based food business.</p>
              <div className="mt-4 p-3 bg-purple-100 rounded-lg">
                <p className="text-sm text-purple-800 font-medium">Average Monthly Income: ₹10,000 - ₹20,000</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-50 to-emerald-100 border-green-200">
            <CardHeader>
              <CardTitle className="text-xl text-green-800">Beauty & Wellness</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-green-700">Start your beauty parlor or wellness center with professional training support.</p>
              <div className="mt-4 p-3 bg-green-100 rounded-lg">
                <p className="text-sm text-green-800 font-medium">Average Monthly Income: ₹20,000 - ₹35,000</p>
              </div>
            </CardContent>
          </Card>
        </div>
        </div>
      </div>

      {/* Contact Us Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4">Contact Us</h2>
            <p className="text-base sm:text-lg text-blue-100 px-4">
              Get in touch with us for any queries or support
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            <div className="text-center">
              <Phone className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 text-blue-200" />
              <h3 className="text-lg sm:text-xl font-semibold mb-2">Phone Support</h3>
              <p className="text-blue-100 text-sm sm:text-base">+91 9497589094</p>
              <p className="text-blue-100 text-sm sm:text-base">Mon-Fri, 9AM-6PM</p>
            </div>
            
            <div className="text-center">
              <Mail className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 text-blue-200" />
              <h3 className="text-lg sm:text-xl font-semibold mb-2">Email Support</h3>
              <p className="text-blue-100 text-sm sm:text-base break-all">teamelifesociety@gmail.com</p>
              <p className="text-blue-100 text-sm sm:text-base">We'll respond within 24 hours</p>
            </div>
            
            <div className="text-center">
              <MapPin className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 text-blue-200" />
              <h3 className="text-lg sm:text-xl font-semibold mb-2">Office Address</h3>
              <p className="text-blue-100 text-sm sm:text-base">Forza Mall Complex -Tirur</p>
              <p className="text-blue-100 text-sm sm:text-base">Kerala, India - 676101</p>
            </div>
          </div>
        </div>
      </div>
    </div>;
};
export default LandingPage;