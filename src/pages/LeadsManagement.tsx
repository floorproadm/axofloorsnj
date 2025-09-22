import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { 
  Users, UserCheck, Clock, Star, Phone, Mail, MapPin, 
  Calendar, Edit, Plus, Filter, Search, Eye, ArrowRight,
  AlertCircle, CheckCircle, XCircle, TrendingUp
} from 'lucide-react';
import { formatDate, formatCurrency } from '@/lib/utils';

interface Lead {
  id: string;
  name: string;
  email?: string;
  phone: string;
  lead_source: string;
  status: string;
  priority: string;
  services: string[];
  budget?: number;
  room_size?: string;
  location?: string;
  address?: string;
  city?: string;
  zip_code?: string;
  message?: string;
  assigned_to?: string;
  follow_up_date?: string;
  last_contacted_at?: string;
  converted_to_project_id?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

const LeadsManagement = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  
  // Stats
  const [stats, setStats] = useState({
    totalLeads: 0,
    newLeads: 0,
    contactedLeads: 0,
    qualifiedLeads: 0,
    convertedLeads: 0,
    conversionRate: 0
  });

  useEffect(() => {
    loadLeads();
  }, []);

  useEffect(() => {
    filterLeads();
  }, [leads, searchTerm, statusFilter, sourceFilter, priorityFilter]);

  const loadLeads = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const leadsData = (data || []).map(lead => ({
        ...lead,
        services: Array.isArray(lead.services) ? lead.services as string[] : []
      }));
      
      setLeads(leadsData);
      calculateStats(leadsData);
      
    } catch (error) {
      console.error('Error loading leads:', error);
      toast({
        title: "Error loading leads",
        description: "Please refresh and try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (leadsData: Lead[]) => {
    const total = leadsData.length;
    const newCount = leadsData.filter(l => l.status === 'new').length;
    const contactedCount = leadsData.filter(l => l.status === 'contacted').length;
    const qualifiedCount = leadsData.filter(l => l.status === 'qualified').length;
    const convertedCount = leadsData.filter(l => l.status === 'converted').length;
    const conversionRate = total > 0 ? Math.round((convertedCount / total) * 100) : 0;

    setStats({
      totalLeads: total,
      newLeads: newCount,
      contactedLeads: contactedCount,
      qualifiedLeads: qualifiedCount,
      convertedLeads: convertedCount,
      conversionRate
    });
  };

  const filterLeads = () => {
    let filtered = leads;

    if (searchTerm) {
      filtered = filtered.filter(lead => 
        lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.phone.includes(searchTerm) ||
        lead.city?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(lead => lead.status === statusFilter);
    }

    if (sourceFilter !== 'all') {
      filtered = filtered.filter(lead => lead.lead_source === sourceFilter);
    }

    if (priorityFilter !== 'all') {
      filtered = filtered.filter(lead => lead.priority === priorityFilter);
    }

    setFilteredLeads(filtered);
  };

  const updateLeadStatus = async (leadId: string, newStatus: string) => {
    try {
      const updateData: any = { 
        status: newStatus,
        updated_at: new Date().toISOString()
      };
      
      if (newStatus === 'contacted') {
        updateData.last_contacted_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('leads')
        .update(updateData)
        .eq('id', leadId);

      if (error) throw error;

      toast({
        title: "Status updated",
        description: `Lead status changed to ${newStatus}`
      });

      loadLeads();
      
    } catch (error) {
      console.error('Error updating lead status:', error);
      toast({
        title: "Error updating status",
        description: "Please try again.",
        variant: "destructive"
      });
    }
  };

  const updateLeadNotes = async (leadId: string, notes: string) => {
    try {
      const { error } = await supabase
        .from('leads')
        .update({ notes, updated_at: new Date().toISOString() })
        .eq('id', leadId);

      if (error) throw error;

      toast({
        title: "Notes updated",
        description: "Lead notes have been saved."
      });

      loadLeads();
      
    } catch (error) {
      console.error('Error updating notes:', error);
      toast({
        title: "Error updating notes", 
        description: "Please try again.",
        variant: "destructive"
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'new': return <AlertCircle className="w-4 h-4" />;
      case 'contacted': return <Phone className="w-4 h-4" />;
      case 'qualified': return <CheckCircle className="w-4 h-4" />;
      case 'converted': return <TrendingUp className="w-4 h-4" />;
      case 'lost': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'contacted': return 'bg-yellow-100 text-yellow-800';
      case 'qualified': return 'bg-green-100 text-green-800';
      case 'converted': return 'bg-purple-100 text-purple-800';
      case 'lost': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-grey">Loading leads...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="container mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-navy">Leads Management</h1>
            <p className="text-grey mt-2">Manage and track all your potential customers</p>
          </div>
          <Button className="gold-gradient text-black">
            <Plus className="w-4 h-4 mr-2" />
            Add Manual Lead
          </Button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full mb-2 mx-auto">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-xl font-bold text-navy">{stats.totalLeads}</div>
              <div className="text-xs text-grey">Total Leads</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full mb-2 mx-auto">
                <AlertCircle className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-xl font-bold text-navy">{stats.newLeads}</div>
              <div className="text-xs text-grey">New</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center w-10 h-10 bg-yellow-100 rounded-full mb-2 mx-auto">
                <Phone className="w-5 h-5 text-yellow-600" />
              </div>
              <div className="text-xl font-bold text-navy">{stats.contactedLeads}</div>
              <div className="text-xs text-grey">Contacted</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-full mb-2 mx-auto">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div className="text-xl font-bold text-navy">{stats.qualifiedLeads}</div>
              <div className="text-xs text-grey">Qualified</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center w-10 h-10 bg-purple-100 rounded-full mb-2 mx-auto">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
              <div className="text-xl font-bold text-navy">{stats.convertedLeads}</div>
              <div className="text-xs text-grey">Converted</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center w-10 h-10 bg-gold/20 rounded-full mb-2 mx-auto">
                <Star className="w-5 h-5 text-gold" />
              </div>
              <div className="text-xl font-bold text-navy">{stats.conversionRate}%</div>
              <div className="text-xs text-grey">Conversion</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4 items-end">
              <div className="flex-1 min-w-[200px]">
                <Label htmlFor="search">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-grey" />
                  <Input
                    id="search"
                    placeholder="Search by name, email, phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div>
                <Label>Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="contacted">Contacted</SelectItem>
                    <SelectItem value="qualified">Qualified</SelectItem>
                    <SelectItem value="converted">Converted</SelectItem>
                    <SelectItem value="lost">Lost</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Source</Label>
                <Select value={sourceFilter} onValueChange={setSourceFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="All Sources" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sources</SelectItem>
                    <SelectItem value="quiz">Quiz</SelectItem>
                    <SelectItem value="contact_form">Contact Form</SelectItem>
                    <SelectItem value="phone_call">Phone Call</SelectItem>
                    <SelectItem value="referral">Referral</SelectItem>
                    <SelectItem value="social_media">Social Media</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Priority</Label>
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="All Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priority</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setSourceFilter('all');
                  setPriorityFilter('all');
                }}
              >
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Leads List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Leads ({filteredLeads.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredLeads.length === 0 ? (
                <p className="text-grey text-center py-8">
                  {leads.length === 0 ? 'No leads yet.' : 'No leads match your filters.'}
                </p>
              ) : (
                filteredLeads.map((lead) => (
                  <div key={lead.id} className="border rounded-lg p-4 hover:bg-grey-light/30 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-semibold text-navy">{lead.name}</h4>
                          <Badge className={getStatusColor(lead.status)}>
                            {getStatusIcon(lead.status)}
                            <span className="ml-1">{lead.status}</span>
                          </Badge>
                          <Badge className={getPriorityColor(lead.priority)}>
                            {lead.priority} priority
                          </Badge>
                          <Badge variant="outline">
                            {lead.lead_source}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-grey">
                          {lead.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {lead.email}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {lead.phone}
                          </span>
                          {lead.city && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {lead.city}, NJ
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(lead.created_at)}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Eye className="w-3 h-3 mr-1" />
                              View
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Lead Details: {lead.name}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-6">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label className="text-sm font-medium">Contact Info</Label>
                                  <div className="mt-2 space-y-1">
                                    {lead.email && <p className="text-sm text-grey">{lead.email}</p>}
                                    <p className="text-sm text-grey">{lead.phone}</p>
                                    {lead.address && <p className="text-sm text-grey">{lead.address}</p>}
                                    {lead.city && <p className="text-sm text-grey">{lead.city}, NJ {lead.zip_code}</p>}
                                  </div>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium">Lead Info</Label>
                                  <div className="mt-2 space-y-1">
                                    <p className="text-sm text-grey">Source: {lead.lead_source}</p>
                                    <p className="text-sm text-grey">Status: {lead.status}</p>
                                    <p className="text-sm text-grey">Priority: {lead.priority}</p>
                                    <p className="text-sm text-grey">Created: {formatDate(lead.created_at)}</p>
                                  </div>
                                </div>
                              </div>
                              
                              {lead.services.length > 0 && (
                                <div>
                                  <Label className="text-sm font-medium">Services Interested</Label>
                                  <p className="text-sm text-grey mt-1">{lead.services.join(', ')}</p>
                                </div>
                              )}
                              
                              {(lead.budget || lead.room_size) && (
                                <div className="grid grid-cols-2 gap-4">
                                  {lead.budget && (
                                    <div>
                                      <Label className="text-sm font-medium">Budget</Label>
                                      <p className="text-sm text-grey mt-1">{formatCurrency(lead.budget)}</p>
                                    </div>
                                  )}
                                  {lead.room_size && (
                                    <div>
                                      <Label className="text-sm font-medium">Room Size</Label>
                                      <p className="text-sm text-grey mt-1">{lead.room_size} sq ft</p>
                                    </div>
                                  )}
                                </div>
                              )}
                              
                              {lead.message && (
                                <div>
                                  <Label className="text-sm font-medium">Message</Label>
                                  <p className="text-sm text-grey mt-1">{lead.message}</p>
                                </div>
                              )}
                              
                              <div>
                                <Label className="text-sm font-medium">Notes</Label>
                                <Textarea
                                  placeholder="Add notes about this lead..."
                                  defaultValue={lead.notes || ''}
                                  onBlur={(e) => updateLeadNotes(lead.id, e.target.value)}
                                  className="mt-1"
                                />
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                        
                        <Select 
                          value={lead.status} 
                          onValueChange={(value) => updateLeadStatus(lead.id, value)}
                        >
                          <SelectTrigger className="w-[120px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="new">New</SelectItem>
                            <SelectItem value="contacted">Contacted</SelectItem>
                            <SelectItem value="qualified">Qualified</SelectItem>
                            <SelectItem value="converted">Converted</SelectItem>
                            <SelectItem value="lost">Lost</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    {(lead.services.length > 0 || lead.budget || lead.room_size) && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm border-t pt-3">
                        {lead.services.length > 0 && (
                          <div>
                            <span className="font-medium text-navy">Services:</span>
                            <p className="text-grey">{lead.services.join(', ')}</p>
                          </div>
                        )}
                        {lead.budget && (
                          <div>
                            <span className="font-medium text-navy">Budget:</span>
                            <p className="text-grey">{formatCurrency(lead.budget)}</p>
                          </div>
                        )}
                        {lead.room_size && (
                          <div>
                            <span className="font-medium text-navy">Area:</span>
                            <p className="text-grey">{lead.room_size} sq ft</p>
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                      <Button size="sm" className="gold-gradient text-black">
                        <Phone className="w-3 h-3 mr-1" />
                        Call
                      </Button>
                      <Button variant="outline" size="sm">
                        <Mail className="w-3 h-3 mr-1" />
                        Email
                      </Button>
                      <Button variant="outline" size="sm">
                        <ArrowRight className="w-3 h-3 mr-1" />
                        Convert to Project
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LeadsManagement;