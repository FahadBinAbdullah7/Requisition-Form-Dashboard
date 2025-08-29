
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Ticket, CheckCircle2, Loader2 } from 'lucide-react';
import { getAllTickets } from './actions';

async function getTicketStats() {
  try {
    const sheetData = await getAllTickets();
    if (!sheetData.values || sheetData.values.length <= 1) {
      return { total: 0, solved: 0, inProgress: 0 };
    }
    const headers = sheetData.values[0];
    const tickets = sheetData.values.slice(1);
    
    const statusIndex = headers.indexOf('Status');
    if (statusIndex === -1) {
      return { total: tickets.length, solved: 0, inProgress: 0 };
    }

    let solved = 0;
    let inProgress = 0;

    tickets.forEach(ticket => {
      const status = ticket[statusIndex];
      if (status === 'Done') {
        solved++;
      } else if (status === 'In Progress') {
        inProgress++;
      }
    });

    return { total: tickets.length, solved, inProgress };
  } catch (error) {
    console.error("Failed to fetch ticket stats:", error);
    return { total: 0, solved: 0, inProgress: 0 };
  }
}


export default async function Home() {
  const statsData = await getTicketStats();
  
  const stats = [
    { title: 'Total Tickets', value: statsData.total.toString(), icon: <Ticket className="h-6 w-6 text-muted-foreground" /> },
    { title: 'Tickets Solved', value: statsData.solved.toString(), icon: <CheckCircle2 className="h-6 w-6 text-muted-foreground" /> },
    { title: 'Work In Progress', value: statsData.inProgress.toString(), icon: <Loader2 className="h-6 w-6 text-muted-foreground" /> },
  ];

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      <div className="grid gap-6 md:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              {stat.icon}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8">
        <Card>
            <CardHeader>
                <CardTitle>Welcome to SheetFlow!</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">
                    This is your central hub for managing projects and tickets. Use the navigation above to create new tickets, view existing ones, or manage your projects on the Kanban board.
                </p>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
