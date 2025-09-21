import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { 
  Download, 
  FileText, 
  Table, 
  FileSpreadsheet, 
  Calendar,
  User,
  MessageSquare,
  Filter,
  Search
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import ChatDataViewer from '../components/ChatDataViewer';

const ExportChats = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [exportHistory, setExportHistory] = useState([]);
  const [filters, setFilters] = useState({
    format: 'json',
    startDate: '',
    endDate: '',
    writerId: '',
    email: ''
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [showViewer, setShowViewer] = useState(false);

  // Load export history from API
  useEffect(() => {
    loadExportHistory();
  }, []);

  const loadExportHistory = async () => {
    try {
      const response = await fetch(`${process.env.VITE_API_BASE_URL || 'https://thinkscribe-xk1e.onrender.com/api'}/chat/export/history`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('thinqscribe_auth_token')}`,
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setExportHistory(data.exports || []);
      }
    } catch (error) {
      console.error('Failed to load export history:', error);
      // Fallback to mock data
      setExportHistory([
        {
          filename: 'writer_chats_2025-09-12.json',
          format: 'json',
          totalChats: 89,
          totalMessages: 533,
          createdAt: '2025-09-12T22:57:06.660Z',
          sizeFormatted: '2.3 MB'
        }
      ]);
    }
  };

  const handleExport = async () => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (filters.format) queryParams.append('format', filters.format);
      if (filters.startDate) queryParams.append('startDate', filters.startDate);
      if (filters.endDate) queryParams.append('endDate', filters.endDate);
      if (filters.writerId) queryParams.append('writerId', filters.writerId);
      if (filters.email) queryParams.append('email', filters.email);

      const url = `${process.env.VITE_API_BASE_URL || 'https://thinkscribe-xk1e.onrender.com/api'}/chat/export/writer-chats?${queryParams}`;
      console.log('Making export request to:', url);
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('thinqscribe_auth_token')}`,
        }
      });

      console.log('Export response status:', response.status);
      console.log('Export response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Export failed:', errorText);
        throw new Error(`Export failed: ${response.status} ${errorText}`);
      }

      // Get filename from response headers
      const contentDisposition = response.headers.get('content-disposition');
      const filename = contentDisposition 
        ? contentDisposition.split('filename=')[1]?.replace(/"/g, '') 
        : `writer_chats_${new Date().toISOString().split('T')[0]}.${filters.format}`;

      // Create download link
      const blob = await response.blob();
      console.log('Blob type:', blob.type);
      console.log('Blob size:', blob.size);
      
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);

      toast.success('Export completed successfully!');
      
      // Refresh export history
      setExportHistory(prev => [{
        id: Date.now(),
        filename,
        format: filters.format,
        totalChats: 89, // This would come from response
        totalMessages: 533,
        createdAt: new Date().toISOString(),
        size: `${(blob.size / 1024 / 1024).toFixed(1)} MB`
      }, ...prev]);

    } catch (error) {
      console.error('Export error:', error);
      toast.error('Export failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewFile = async (filename) => {
    if (!filename.endsWith('.json')) {
      toast.error('Only JSON files can be viewed in the browser');
      return;
    }

    try {
      const response = await fetch(`${process.env.VITE_API_BASE_URL || 'https://thinkscribe-xk1e.onrender.com/api'}/chat/export/view/${filename}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('thinqscribe_auth_token')}`,
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSelectedFile(data);
        setShowViewer(true);
      } else {
        toast.error('Failed to load file');
      }
    } catch (error) {
      console.error('Error loading file:', error);
      toast.error('Failed to load file');
    }
  };

  const getFormatIcon = (format) => {
    switch (format) {
      case 'json': return <FileText className="w-4 h-4" />;
      case 'csv': return <Table className="w-4 h-4" />;
      case 'xlsx': return <FileSpreadsheet className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getFormatColor = (format) => {
    switch (format) {
      case 'json': return 'bg-blue-100 text-blue-800';
      case 'csv': return 'bg-green-100 text-green-800';
      case 'xlsx': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Export Writer Chats
          </h1>
          <p className="text-muted-foreground">
            Export writer chat data in various formats for analysis and reporting
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Export Form */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="w-5 h-5" />
                  Export Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Format Selection */}
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Export Format
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {['json', 'csv', 'xlsx'].map((format) => (
                      <Button
                        key={format}
                        variant={filters.format === format ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFilters(prev => ({ ...prev, format }))}
                        className="flex items-center gap-2"
                      >
                        {getFormatIcon(format)}
                        {format.toUpperCase()}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Date Range */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Date Range (Optional)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="date"
                      value={filters.startDate}
                      onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                      className="px-3 py-2 border border-border rounded-md text-sm"
                      placeholder="Start Date"
                    />
                    <input
                      type="date"
                      value={filters.endDate}
                      onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                      className="px-3 py-2 border border-border rounded-md text-sm"
                      placeholder="End Date"
                    />
                  </div>
                </div>

                {/* Writer ID Filter */}
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Writer ID (Optional)
                  </label>
                  <input
                    type="text"
                    value={filters.writerId}
                    onChange={(e) => setFilters(prev => ({ ...prev, writerId: e.target.value }))}
                    className="w-full px-3 py-2 border border-border rounded-md text-sm"
                    placeholder="Enter writer ID"
                  />
                </div>

                {/* Email Filter */}
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Email Filter (Optional)
                  </label>
                  <input
                    type="email"
                    value={filters.email}
                    onChange={(e) => setFilters(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-border rounded-md text-sm"
                    placeholder="Enter email address"
                  />
                </div>

                {/* Export Button */}
                <Button 
                  onClick={handleExport}
                  disabled={isLoading}
                  className="w-full"
                  size="lg"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Exporting...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Export Chats
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Quick Stats
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Total Chats</span>
                    <span className="font-semibold">89</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Total Messages</span>
                    <span className="font-semibold">533</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Active Writers</span>
                    <span className="font-semibold">12</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Export History */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Export History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {exportHistory.map((exportItem) => (
                    <div
                      key={exportItem.id}
                      className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${getFormatColor(exportItem.format)}`}>
                          {getFormatIcon(exportItem.format)}
                        </div>
                        <div>
                          <div className="font-medium text-foreground">
                            {exportItem.filename}
                          </div>
                        <div className="text-sm text-muted-foreground">
                          {exportItem.totalChats} chats • {exportItem.totalMessages} messages • {exportItem.sizeFormatted || exportItem.size}
                        </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(exportItem.createdAt).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={getFormatColor(exportItem.format)}>
                          {exportItem.format.toUpperCase()}
                        </Badge>
                        {exportItem.format === 'json' && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleViewFile(exportItem.filename)}
                          >
                            <FileText className="w-4 h-4" />
                          </Button>
                        )}
                        <Button variant="outline" size="sm">
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Chat Data Viewer Modal */}
      {showViewer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg shadow-xl w-full max-w-6xl h-[80vh] flex flex-col">
            <ChatDataViewer 
              data={selectedFile} 
              onClose={() => {
                setShowViewer(false);
                setSelectedFile(null);
              }} 
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ExportChats;
