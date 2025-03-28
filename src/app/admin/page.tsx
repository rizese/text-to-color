import { prisma } from '@/lib/prisma';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin Dashboard - Text to Color',
  description: 'Admin dashboard for Text to Color application',
};

export const dynamic = 'force-dynamic';

type ColorRequestWithSession = {
  id: number;
  sessionId: string;
  inputText: string;
  hexColor: string;
  rawOutput: string;
  createdAt: Date;
  session: {
    id: string;
    ipAddress: string | null;
  };
};

async function getColorRequests() {
  try {
    const colorRequests = await prisma.colorRequest.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        session: true,
      },
      take: 100, // Limit to 100 most recent requests
    });

    return colorRequests as ColorRequestWithSession[];
  } catch (error) {
    console.error('Error fetching color requests:', error);
    return [] as ColorRequestWithSession[];
  }
}

export default async function AdminPage() {
  const colorRequests = await getColorRequests();

  return (
    <div className="container mx-auto px-2 py-8">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      <div>
        <h2 className="text-xl font-semibold mb-4">
          Recent Color Requests ({colorRequests.length})
        </h2>

        <div className="overflow-x-auto">
          <table className="min-w-full bg-neutral-800 ">
            <thead className="sticky top-0">
              <tr className="bg-neutral-700">
                <th className="py-2 px-4 text-left">ID</th>
                <th className="py-2 px-4 text-left">Session ID</th>
                <th className="py-2 px-4 text-left">IP Address</th>
                <th className="py-2 px-4 text-left">Input Text</th>
                <th className="py-2 px-4 text-left">Color</th>
                <th className="py-2 px-4 text-left">Output</th>
                <th className="py-2 px-4 text-left">Created At</th>
              </tr>
            </thead>
            <tbody>
              {colorRequests.map((request) => (
                <tr key={request.id} className="hover:bg-neutral-700">
                  <td className="py-2 px-4">{request.id}</td>
                  <td className="py-2 px-4">
                    <div className="whitespace-nowrap overflow-x-auto font-mono text-xs max-w-20 py-4">
                      {request.sessionId}
                    </div>
                  </td>
                  <td className="py-2 px-4">
                    <div className="whitespace-nowrap overflow-x-auto font-mono text-xs max-w-20 py-4">
                      {request.session.ipAddress || 'N/A'}
                    </div>
                  </td>
                  <td className="py-2 px-4">
                    <div className="italic">{request.inputText}</div>
                  </td>
                  <td className="py-2 px-4">
                    <div className="flex items-center font-mono text-xs">
                      <div
                        className="w-6 h-6 mr-2 rounded-full"
                        style={{ backgroundColor: request.hexColor }}
                      />
                      {request.hexColor}
                    </div>
                  </td>
                  <td className="py-2 px-4">
                    <div className="flex items-center max-h-20 overflow-y-auto">
                      <div className="whitespace-pre-wrap text-xs">
                        {request.rawOutput}
                      </div>
                    </div>
                  </td>
                  <td className="py-2 px-4 text-xs">
                    {new Date(request.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}

              {colorRequests.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="py-4 px-4 text-center text-gray-500"
                  >
                    No color requests found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
