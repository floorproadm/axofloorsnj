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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { 
  Users, UserCheck, Clock, Star, Phone, Mail, MapPin, 
  Calendar, Edit, Plus, Filter, Search, Eye, ArrowRight,
  AlertCircle, CheckCircle, XCircle, TrendingUp, Trash2
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

  const deleteLead = async (leadId: string, leadName: string) => {
    try {
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', leadId);

      if (error) throw error;

      toast({
        title: "Lead deleted",
        description: `${leadName} has been removed from your leads.`
      });

      loadLeads();
      
    } catch (error) {
      console.error('Error deleting lead:', error);
      toast({
        title: "Error deleting lead",
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
    <div className="min-h-screen bg-background p-2 sm:p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col gap-4 mb-4 sm:mb-6 md:mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-navy">Leads Management</h1>
              <p className="text-grey mt-1 text-sm sm:text-base">Manage and track all your potential customers</p>
            </div>
            <Button className="gold-gradient text-black w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              Add Lead
            </Button>
          </div>
        </div>

        {/* Stats Overview - Mobile First */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-2 sm:gap-3 md:gap-4 mb-4 sm:mb-6 md:mb-8">
          <Card className="col-span-1">
            <CardContent className="p-2 sm:p-3 md:p-4 text-center">
              <div className="flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-blue-100 rounded-full mb-1 sm:mb-2 mx-auto">
                <Users className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-blue-600" />
              </div>
              <div className="text-sm sm:text-lg md:text-xl font-bold text-navy">{stats.totalLeads}</div>
              <div className="text-xs text-grey">Total</div>
            </CardContent>
          </Card>

          <Card className="col-span-1">
            <CardContent className="p-2 sm:p-3 md:p-4 text-center">
              <div className="flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-blue-100 rounded-full mb-1 sm:mb-2 mx-auto">
                <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-blue-600" />
              </div>
              <div className="text-sm sm:text-lg md:text-xl font-bold text-navy">{stats.newLeads}</div>
              <div className="text-xs text-grey">New</div>
            </CardContent>
          </Card>

          <Card className="col-span-1">
            <CardContent className="p-2 sm:p-3 md:p-4 text-center">
              <div className="flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-yellow-100 rounded-full mb-1 sm:mb-2 mx-auto">
                <Phone className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-yellow-600" />
              </div>
              <div className="text-sm sm:text-lg md:text-xl font-bold text-navy">{stats.contactedLeads}</div>
              <div className="text-xs text-grey">Called</div>
            </CardContent>
          </Card>

          <Card className="col-span-1">
            <CardContent className="p-2 sm:p-3 md:p-4 text-center">
              <div className="flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-green-100 rounded-full mb-1 sm:mb-2 mx-auto">
                <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-green-600" />
              </div>
              <div className="text-sm sm:text-lg md:text-xl font-bold text-navy">{stats.qualifiedLeads}</div>
              <div className="text-xs text-grey">Qualified</div>
            </CardContent>
          </Card>

          <Card className="col-span-1">
            <CardContent className="p-2 sm:p-3 md:p-4 text-center">
              <div className="flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-purple-100 rounded-full mb-1 sm:mb-2 mx-auto">
                <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-purple-600" />
              </div>
              <div className="text-sm sm:text-lg md:text-xl font-bold text-navy">{stats.convertedLeads}</div>
              <div className="text-xs text-grey">Converted</div>
            </CardContent>
          </Card>

          <Card className="col-span-1">
            <CardContent className="p-2 sm:p-3 md:p-4 text-center">
              <div className="flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-gold/20 rounded-full mb-1 sm:mb-2 mx-auto">
                <Star className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-gold" />
              </div>
              <div className="text-sm sm:text-lg md:text-xl font-bold text-navy">{stats.conversionRate}%</div>
              <div className="text-xs text-grey">Rate</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters - Mobile First */}
        <Card className="mb-4 sm:mb-6">
          <CardContent className="p-3 sm:p-4">
            <div className="space-y-3 sm:space-y-4">
              {/* Search Bar - Full Width */}
              <div className="w-full">
                <Label htmlFor="search" className="text-sm font-medium">Search</Label>
                <div className="relative mt-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-grey" />
                  <Input
                    id="search"
                    placeholder="Name, email, phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-10"
                  />
                </div>
              </div>
              
              {/* Filter Controls - Mobile Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full h-10">
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent className="bg-white z-50">
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
                  <Label className="text-sm font-medium">Source</Label>
                  <Select value={sourceFilter} onValueChange={setSourceFilter}>
                    <SelectTrigger className="w-full h-10">
                      <SelectValue placeholder="All Sources" />
                    </SelectTrigger>
                    <SelectContent className="bg-white z-50">
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
                  <Label className="text-sm font-medium">Priority</Label>
                  <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                    <SelectTrigger className="w-full h-10">
                      <SelectValue placeholder="All Priority" />
                    </SelectTrigger>
                    <SelectContent className="bg-white z-50">
                      <SelectItem value="all">All Priority</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end">
                  <Button 
                    variant="outline" 
                    className="w-full h-10"
                    onClick={() => {
                      setSearchTerm('');
                      setStatusFilter('all');
                      setSourceFilter('all');
                      setPriorityFilter('all');
                    }}
                  >
                    Clear All
                  </Button>
                </div>
              </div>
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
                  <div key={lead.id} className="border rounded-lg p-3 sm:p-4 hover:bg-grey-light/30 transition-colors">
                    <div className="space-y-3">
                      {/* Header Section - Mobile Optimized */}
                      <div className="flex flex-col gap-2">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-navy text-sm sm:text-base truncate">{lead.name}</h4>
                          </div>
                          <div className="flex flex-wrap gap-1 flex-shrink-0">
                            <Badge className={getStatusColor(lead.status)}>
                              {getStatusIcon(lead.status)}
                              <span className="ml-1 text-xs">{lead.status}</span>
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-1">
                          <Badge className={getPriorityColor(lead.priority)}>
                            <span className="text-xs">{lead.priority}</span>
                          </Badge>
                          <Badge variant="outline">
                            <span className="text-xs">{lead.lead_source}</span>
                          </Badge>
                        </div>
                        
                        {/* Contact Info - Mobile Stack */}
                        <div className="flex flex-col gap-1 text-xs text-grey">
                          {lead.email && (
                            <span className="flex items-center gap-1 truncate">
                              <Mail className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate">{lead.email}</span>
                            </span>
                          )}
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3 flex-shrink-0" />
                              <span>{lead.phone}</span>
                            </span>
                            {lead.city && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3 flex-shrink-0" />
                                <span>{lead.city}, NJ</span>
                              </span>
                            )}
                          </div>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 flex-shrink-0" />
                            <span>{formatDate(lead.created_at)}</span>
                          </span>
                        </div>
                      </div>
                      
                      {/* Project Details */}
                      {(lead.services.length > 0 || lead.budget || lead.room_size) && (
                        <div className="space-y-2 text-xs pt-2 border-t">
                          {lead.services.length > 0 && (
                            <div>
                              <span className="font-medium text-navy">Services: </span>
                              <span className="text-grey">{lead.services.join(', ')}</span>
                            </div>
                          )}
                          <div className="grid grid-cols-2 gap-2">
                            {lead.budget && (
                              <div>
                                <span className="font-medium text-navy">Budget: </span>
                                <span className="text-grey">{formatCurrency(lead.budget)}</span>
                              </div>
                            )}
                            {lead.room_size && (
                              <div>
                                <span className="font-medium text-navy">Area: </span>
                                <span className="text-grey">{lead.room_size} sq ft</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* Action Section */}
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-2 border-t">
                        {/* View Dialog */}
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className="w-full sm:w-auto h-9">
                              <Eye className="w-3 h-3 mr-1" />
                              View
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="mx-2 sm:mx-4 max-w-2xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle className="text-base sm:text-lg">Lead: {lead.name}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 sm:space-y-6">
                              <div className="grid grid-cols-1 gap-4">
                                <div>
                                  <Label className="text-sm font-medium">Contact Info</Label>
                                  <div className="mt-2 space-y-1 text-sm">
                                    {lead.email && <p className="text-grey break-all">{lead.email}</p>}
                                    <p className="text-grey">{lead.phone}</p>
                                    {lead.address && <p className="text-grey">{lead.address}</p>}
                                    {lead.city && <p className="text-grey">{lead.city}, NJ {lead.zip_code}</p>}
                                  </div>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium">Lead Details</Label>
                                  <div className="mt-2 space-y-1 text-sm">
                                    <p className="text-grey">Source: {lead.lead_source}</p>
                                    <p className="text-grey">Status: {lead.status}</p>
                                    <p className="text-grey">Priority: {lead.priority}</p>
                                    <p className="text-grey">Created: {formatDate(lead.created_at)}</p>
                                  </div>
                                </div>
                              </div>
                              
                              {lead.services.length > 0 && (
                                <div>
                                  <Label className="text-sm font-medium">Services</Label>
                                  <p className="text-sm text-grey mt-1">{lead.services.join(', ')}</p>
                                </div>
                              )}
                              
                              {(lead.budget || lead.room_size) && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  {lead.budget && (
                                    <div>
                                      <Label className="text-sm font-medium">Budget</Label>
                                      <p className="text-sm text-grey mt-1">{formatCurrency(lead.budget)}</p>
                                    </div>
                                  )}
                                  {lead.room_size && (
                                    <div>
                                      <Label className="text-sm font-medium">Area</Label>
                                      <p className="text-sm text-grey mt-1">{lead.room_size} sq ft</p>
                                    </div>
                                  )}
                                </div>
                              )}
                              
                              {lead.message && (
                                <div>
                                  <Label className="text-sm font-medium">Message</Label>
                                  <p className="text-sm text-grey mt-1 break-words">{lead.message}</p>
                                </div>
                              )}
                              
                              <div>
                                <Label className="text-sm font-medium">Notes</Label>
                                <Textarea
                                  placeholder="Add notes..."
                                  defaultValue={lead.notes || ''}
                                  onBlur={(e) => updateLeadNotes(lead.id, e.target.value)}
                                  className="mt-1 text-sm"
                                  rows={3}
                                />
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                        
                        {/* Status Select */}
                        <Select 
                          value={lead.status} 
                          onValueChange={(value) => updateLeadStatus(lead.id, value)}
                        >
                          <SelectTrigger className="w-full sm:w-[120px] h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-white z-50">
                            <SelectItem value="new">New</SelectItem>
                            <SelectItem value="contacted">Contacted</SelectItem>
                            <SelectItem value="qualified">Qualified</SelectItem>
                            <SelectItem value="converted">Converted</SelectItem>
                            <SelectItem value="lost">Lost</SelectItem>
                          </SelectContent>
                        </Select>

                        {/* Delete Dialog */}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50 w-full sm:w-auto h-9">
                              <Trash2 className="w-3 h-3" />
                              <span className="sm:hidden ml-1">Delete</span>
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="mx-2 sm:mx-4 max-w-md">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-base">Delete Lead</AlertDialogTitle>
                              <AlertDialogDescription className="text-sm">
                                Delete <strong>{lead.name}</strong>? This cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                              <AlertDialogCancel className="w-full sm:w-auto">Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteLead(lead.id, lead.name)}
                                className="bg-red-600 hover:bg-red-700 w-full sm:w-auto"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t">
                        <Button size="sm" className="gold-gradient text-black h-9">
                          <Phone className="w-3 h-3 mr-1" />
                          Call
                        </Button>
                        <Button variant="outline" size="sm" className="h-9">
                          <Mail className="w-3 h-3 mr-1" />
                          Email
                        </Button>
                        <Button variant="outline" size="sm" className="h-9">
                          <ArrowRight className="w-3 h-3 mr-1" />
                          Convert
                        </Button>
                      </div>
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