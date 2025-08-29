
'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { getMembers, addMember } from '../../actions';
import { useToast } from '@/hooks/use-toast';
import { Loader2, PlusCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const ADMIN_PASSWORD = 'admin';

export default function MembersPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [members, setMembers] = useState<string[][]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberTeam, setNewMemberTeam] = useState('');
  
  const predefinedTeams = ["CM", "SMD", "QAC", "Class Ops"];
  
  const { toast } = useToast();

  const fetchMembers = async () => {
    setIsLoading(true);
    try {
      const membersData = await getMembers();
       if (membersData && membersData.values && membersData.values.length > 0) {
        setHeaders(membersData.values[0]);
        setMembers(membersData.values.slice(1));
      } else {
        // If the sheet is empty, pre-populate with default teams
        setHeaders(['Name', 'Team']);
        setMembers([]);
        await addMember('Team Default', 'CM'); // This will trigger seeding all teams
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load members from Google Sheet.");
    } finally {
      setIsLoading(false);
    }
  };

 useEffect(() => {
    // Session storage is only available in the browser
    if (typeof window !== 'undefined') {
        const authStatus = sessionStorage.getItem('isAdminAuthenticated') === 'true';
        setIsAuthenticated(authStatus);
         if (!authStatus) {
            setIsLoading(false);
        }
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchMembers();
    }
  }, [isAuthenticated]);
  
  const handleLogin = (e: FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      sessionStorage.setItem('isAdminAuthenticated', 'true');
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('Incorrect password. Please try again.');
    }
  };
  
  const handleFormSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const result = await addMember(newMemberName, newMemberTeam);

    if (result.success) {
      toast({
        title: 'Success!',
        description: `Member "${newMemberName}" has been added.`,
      });
      setNewMemberName('');
      setNewMemberTeam('');
      setIsDialogOpen(false);
      await fetchMembers();
    } else {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: result.error || 'An unknown error occurred.',
      });
    }
    setIsSubmitting(false);
  };

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto flex items-center justify-center min-h-[calc(100vh-10rem)]">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Admin Access</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter admin password"
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full">
                Login
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <div className="container mx-auto py-8 px-4 md:px-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Manage Members</h1>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2" />
              Add New Member
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Member</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleFormSubmit}>
              <div className="py-4 space-y-4">
                <div>
                  <Label htmlFor="new-member-name">Member Name</Label>
                  <Input
                    id="new-member-name"
                    value={newMemberName}
                    onChange={(e) => setNewMemberName(e.target.value)}
                    placeholder="e.g., John Doe"
                  />
                </div>
                  <div>
                  <Label htmlFor="new-member-team">Team</Label>
                   <Select value={newMemberTeam} onValueChange={setNewMemberTeam}>
                    <SelectTrigger id="new-member-team">
                        <SelectValue placeholder="Select a team" />
                    </SelectTrigger>
                    <SelectContent>
                        {predefinedTeams.map(team => (
                            <SelectItem key={team} value={team}>{team}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Add Member
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Team Members</CardTitle>
            <CardDescription>
                This list is sourced from Sheet2 in your Google Sheet.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
                <div className="flex justify-center items-center py-8"><Loader2 className="mr-2 h-8 w-8 animate-spin" /> Loading members...</div>
            ) : error ? (
                <p className="text-destructive text-center py-8">{error}</p>
            ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  {headers.map((header) => <TableHead key={header}>{header}</TableHead>)}
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member, rowIndex) => (
                  <TableRow key={rowIndex}>
                    {member.map((cell, cellIndex) => <TableCell key={cellIndex} className="font-medium">{cell}</TableCell>)}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

    
    