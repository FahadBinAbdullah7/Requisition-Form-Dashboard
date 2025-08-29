
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getAllTickets, createProjectFromTicket, updateTicketStatus } from '@/app/actions';
import { Loader2, FolderPlus } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { parseISO, isWithinInterval, startOfDay, endOfDay } from 'date-fns';

const ADMIN_PASSWORD = 'admin';

export default function AllTicketsPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [tickets, setTickets] = useState<string[][]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<{rowIndex: number, values: string[]} | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const { toast } = useToast();

  const fetchTickets = async () => {
    setIsLoading(true);
    try {
      const sheetData = await getAllTickets();
      if (sheetData && sheetData.values && sheetData.values.length > 0) {
        setHeaders(sheetData.values[0]);
        // Reverse tickets to show most recent first
        setTickets(sheetData.values.slice(1).reverse());
      } else {
        setHeaders([]);
        setTickets([]);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load tickets from Google Sheet.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
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
      fetchTickets();
    }
  }, [isAuthenticated]);
  
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      sessionStorage.setItem('isAdminAuthenticated', 'true');
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('Incorrect password. Please try again.');
    }
  };

  const handleSelectTicket = (rowIndex: number, values: string[]) => {
     if (selectedTicket?.rowIndex === rowIndex) {
        setSelectedTicket(null); // Deselect
     } else {
        setSelectedTicket({ rowIndex, values });
     }
  }

  const handleCreateProject = async () => {
    if (!selectedTicket) return;
    setIsSubmitting(true);
    
    // Adjust rowIndex for descending order and header offset
    const originalIndex = tickets.length - 1 - selectedTicket.rowIndex;
    const result = await createProjectFromTicket({ ...selectedTicket, rowIndex: originalIndex + 1 });

    if (result.success) {
      toast({
        title: 'Project Created!',
        description: 'The ticket has been converted to a project.',
      });
      setSelectedTicket(null);
      await fetchTickets(); // Refresh the list
    } else {
       toast({
        variant: 'destructive',
        title: 'Error',
        description: result.error || 'Failed to create project.',
      });
    }
    setIsSubmitting(false);
  }

  const handleStatusChange = async (rowIndex: number, newStatus: string) => {
    // The actual sheet row index is the total number of data rows minus the current reversed index, plus one for the header.
    const originalIndex = tickets.length - 1 - rowIndex;
    const sheetRowIndex = originalIndex + 1;
    const result = await updateTicketStatus(sheetRowIndex, newStatus);
    if (result.success) {
        toast({ title: "Status Updated", description: "Ticket status has been saved." });
        // Optimistically update the UI
        const newTickets = [...tickets];
        const statusIndex = headers.indexOf("Status");
        if (statusIndex !== -1) {
            newTickets[rowIndex][statusIndex] = newStatus;
            setTickets(newTickets);
        }
    } else {
        toast({ variant: "destructive", title: "Error", description: result.error || "Failed to update status." });
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto flex items-center justify-center min-h-[calc(100vh-10rem)]">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Admin Access Required</CardTitle>
            <CardDescription>You need to be logged in to view tickets.</CardDescription>
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
               <div className="flex flex-col space-y-2">
                 <Button type="submit" className="w-full">
                    Login
                 </Button>
               </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusIndex = headers.indexOf('Status');
  const createdDateIndex = headers.indexOf('Created Date');

  const filteredTickets = tickets.filter(row => {
    if (!fromDate && !toDate) return true;
    if (createdDateIndex === -1) return true; // Don't filter if date column doesn't exist

    try {
        const ticketDate = parseISO(row[createdDateIndex]);
        const start = fromDate ? startOfDay(parseISO(fromDate)) : new Date(0);
        const end = toDate ? endOfDay(parseISO(toDate)) : new Date();
        return isWithinInterval(ticketDate, { start, end });
    } catch {
        return false; // Invalid date format in sheet
    }
  });

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">All Submitted Tickets</h1>
        {selectedTicket && (
            <Button onClick={handleCreateProject} disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FolderPlus className="mr-2 h-4 w-4" />}
                Create Project
            </Button>
        )}
      </div>
       <Card className="mb-6">
        <CardContent className="p-4 flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
                <Label htmlFor="from-date">From</Label>
                <Input
                    id="from-date"
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="w-40"
                />
            </div>
            <div className="flex items-center gap-2">
                <Label htmlFor="to-date">To</Label>
                <Input
                    id="to-date"
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="w-40"
                />
            </div>
        </CardContent>
       </Card>
      <Card>
          <CardHeader>
            <CardTitle>Tickets from Google Sheet</CardTitle>
            <CardDescription>
                This is a live view of all the tickets submitted through the form. Select one to create a project.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
                <div className="flex justify-center items-center py-8"><Loader2 className="mr-2 h-8 w-8 animate-spin" /> Loading tickets...</div>
            ) : error ? (
                <p className="text-destructive text-center py-8">{error}</p>
            ) : (
             <div className="overflow-x-auto">
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead className="w-[50px]">Select</TableHead>
                    {headers.map((header) => <TableHead key={header}>{header}</TableHead>)}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredTickets.map((row, rowIndex) => (
                    <TableRow key={rowIndex}>
                        <TableCell>
                            <Checkbox 
                                checked={selectedTicket?.rowIndex === rowIndex}
                                onCheckedChange={() => handleSelectTicket(rowIndex, row)}
                            />
                        </TableCell>
                        {row.map((cell, cellIndex) => {
                             if (cellIndex === statusIndex) {
                                return (
                                    <TableCell key={cellIndex}>
                                        <Select
                                            defaultValue={cell}
                                            onValueChange={(newStatus) => handleStatusChange(rowIndex, newStatus)}
                                        >
                                            <SelectTrigger className="w-[150px]">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Open">Open</SelectItem>
                                                <SelectItem value="In Progress">In Progress</SelectItem>
                                                <SelectItem value="Done">Done</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </TableCell>
                                )
                             }
                             if (cellIndex === createdDateIndex) {
                                return <TableCell key={cellIndex}>{cell ? new Date(cell).toLocaleString() : ''}</TableCell>
                             }
                            return <TableCell key={cellIndex}>{cell}</TableCell>
                        })}
                    </TableRow>
                    ))}
                </TableBody>
                </Table>
             </div>
            )}
          </CardContent>
        </Card>
    </div>
  );
}
