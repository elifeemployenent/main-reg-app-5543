import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Edit, Trash2, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface ApplicationsManagementProps {
  permissions: {
    canRead: boolean;
    canWrite: boolean;
    canDelete: boolean;
  };
}

interface Application {
  id: string;
  customer_id: string;
  name: string;
  mobile_number: string;
  address: string;
  ward: string;
  agent_pro: string | null;
  status: 'pending' | 'approved' | 'rejected';
  fee_paid: number;
  created_at: string;
  approved_date: string | null;
  approved_by: string | null;
  category_id: string;
  panchayath_id: string | null;
  preference: string | null;
  categories: {
    name: string;
  } | null;
  panchayaths: {
    name: string;
    district: string;
  } | null;
}

const ApplicationsManagement: React.FC<ApplicationsManagementProps> = ({ permissions }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editingApplication, setEditingApplication] = useState<Application | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Fetch applications
  const { data: applications, isLoading } = useQuery({
    queryKey: ['applications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('applications')
        .select(`
          *,
          categories (name),
          panchayaths (name, district)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Application[];
    },
    enabled: permissions.canRead
  });

  // Update application status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'approved' | 'rejected' }) => {
      const { error } = await supabase
        .from('applications')
        .update({
          status,
          approved_date: status === 'approved' ? new Date().toISOString() : null,
          approved_by: status === 'approved' ? 'admin' : null,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      toast({
        title: 'Success',
        description: 'Application status updated successfully'
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to update application status',
        variant: 'destructive'
      });
    }
  });

  // Delete application
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('applications')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      toast({
        title: 'Success',
        description: 'Application deleted successfully'
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to delete application',
        variant: 'destructive'
      });
    }
  });

  // Update application
  const updateMutation = useMutation({
    mutationFn: async (application: Partial<Application> & { id: string }) => {
      const { error } = await supabase
        .from('applications')
        .update({
          name: application.name,
          mobile_number: application.mobile_number,
          address: application.address,
          ward: application.ward,
          agent_pro: application.agent_pro,
          preference: application.preference,
          fee_paid: application.fee_paid,
          updated_at: new Date().toISOString()
        })
        .eq('id', application.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      setIsEditDialogOpen(false);
      setEditingApplication(null);
      toast({
        title: 'Success',
        description: 'Application updated successfully'
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to update application',
        variant: 'destructive'
      });
    }
  });

  const handleStatusUpdate = (id: string, status: 'approved' | 'rejected') => {
    updateStatusMutation.mutate({ id, status });
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this application?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleEdit = (application: Application) => {
    setEditingApplication(application);
    setIsEditDialogOpen(true);
  };

  const handleUpdate = () => {
    if (editingApplication) {
      updateMutation.mutate(editingApplication);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'approved': return 'default';
      case 'rejected': return 'destructive';
      default: return 'secondary';
    }
  };

  const filteredApplications = applications?.filter(app => {
    const matchesSearch = 
      app.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.mobile_number.includes(searchTerm) ||
      app.customer_id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  }) || [];

  if (!permissions.canRead) {
    return <div>You don't have permission to view applications.</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Applications Management</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by name, mobile, or customer ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Applications Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Mobile</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Fee Paid</TableHead>
                <TableHead>Created Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-4">
                    Loading applications...
                  </TableCell>
                </TableRow>
              ) : filteredApplications.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-4">
                    No applications found
                  </TableCell>
                </TableRow>
              ) : (
                filteredApplications.map((app) => (
                  <TableRow key={app.id}>
                    <TableCell className="font-medium">{app.customer_id}</TableCell>
                    <TableCell>{app.name}</TableCell>
                    <TableCell>{app.mobile_number}</TableCell>
                    <TableCell>{app.categories?.name || 'N/A'}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(app.status)}>
                        {app.status}
                      </Badge>
                    </TableCell>
                    <TableCell>₹{app.fee_paid}</TableCell>
                    <TableCell>{new Date(app.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {permissions.canWrite && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(app)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                        )}
                        {permissions.canWrite && app.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleStatusUpdate(app.id, 'approved')}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleStatusUpdate(app.id, 'rejected')}
                            >
                              <XCircle className="h-3 w-3" />
                            </Button>
                          </>
                        )}
                        {permissions.canDelete && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(app.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Application</DialogTitle>
            </DialogHeader>
            {editingApplication && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={editingApplication.name}
                    onChange={(e) => setEditingApplication({
                      ...editingApplication,
                      name: e.target.value
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="mobile">Mobile Number</Label>
                  <Input
                    id="mobile"
                    value={editingApplication.mobile_number}
                    onChange={(e) => setEditingApplication({
                      ...editingApplication,
                      mobile_number: e.target.value
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    value={editingApplication.address}
                    onChange={(e) => setEditingApplication({
                      ...editingApplication,
                      address: e.target.value
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="ward">Ward</Label>
                  <Input
                    id="ward"
                    value={editingApplication.ward}
                    onChange={(e) => setEditingApplication({
                      ...editingApplication,
                      ward: e.target.value
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="fee">Fee Paid</Label>
                  <Input
                    id="fee"
                    type="number"
                    value={editingApplication.fee_paid}
                    onChange={(e) => setEditingApplication({
                      ...editingApplication,
                      fee_paid: Number(e.target.value)
                    })}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleUpdate}>
                    Update Application
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default ApplicationsManagement;