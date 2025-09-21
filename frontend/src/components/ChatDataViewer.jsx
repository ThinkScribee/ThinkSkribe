import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { 
  MessageSquare, 
  User, 
  Calendar, 
  FileText, 
  ChevronDown, 
  ChevronRight,
  Search,
  Filter,
  Download
} from 'lucide-react';

const ChatDataViewer = ({ data, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredChats, setFilteredChats] = useState([]);
  const [expandedChats, setExpandedChats] = useState(new Set());
  const [selectedChat, setSelectedChat] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'detail'

  useEffect(() => {
    if (data?.chats) {
      setFilteredChats(data.chats);
    }
  }, [data]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = data?.chats?.filter(chat => 
        chat.participants.some(p => 
          p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.email.toLowerCase().includes(searchTerm.toLowerCase())
        ) ||
        chat.messages.some(msg => 
          msg.content.toLowerCase().includes(searchTerm.toLowerCase())
        )
      ) || [];
      setFilteredChats(filtered);
    } else {
      setFilteredChats(data?.chats || []);
    }
  }, [searchTerm, data]);

  const toggleChatExpansion = (chatId) => {
    const newExpanded = new Set(expandedChats);
    if (newExpanded.has(chatId)) {
      newExpanded.delete(chatId);
    } else {
      newExpanded.add(chatId);
    }
    setExpandedChats(newExpanded);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getParticipantInfo = (participants) => {
    const writer = participants.find(p => p.role === 'writer');
    const student = participants.find(p => p.role === 'student');
    return { writer, student };
  };

  const downloadChat = (chat) => {
    const chatData = {
      exportInfo: data.exportInfo,
      chats: [chat]
    };
    
    const blob = new Blob([JSON.stringify(chatData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat_${chat.chatId}.json`;
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  if (!data) {
    return (
      <div className="p-8 text-center">
        <FileText className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">No Data Available</h3>
        <p className="text-muted-foreground">Please select a valid export file to view.</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Chat Data Viewer</h2>
            <p className="text-muted-foreground">
              {data.exportInfo.totalChats} chats • {data.exportInfo.totalMessages} messages
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search chats, participants, or messages..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          <Badge variant="outline">
            {filteredChats.length} of {data.exportInfo.totalChats} chats
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {viewMode === 'list' ? (
          <div className="h-full overflow-y-auto p-6">
            <div className="space-y-4">
              {filteredChats.map((chat) => {
                const { writer, student } = getParticipantInfo(chat.participants);
                const isExpanded = expandedChats.has(chat.chatId);
                
                return (
                  <Card key={chat.chatId} className="hover:shadow-md transition-shadow">
                    <CardHeader 
                      className="cursor-pointer"
                      onClick={() => toggleChatExpansion(chat.chatId)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                          )}
                          <div>
                            <CardTitle className="text-lg">
                              {writer?.name} ↔ {student?.name}
                            </CardTitle>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                              <span className="flex items-center gap-1">
                                <MessageSquare className="w-3 h-3" />
                                {chat.messages.length} messages
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {formatDate(chat.updatedAt)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {chat.messages.length} msgs
                          </Badge>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              downloadChat(chat);
                            }}
                          >
                            <Download className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    
                    {isExpanded && (
                      <CardContent className="pt-0">
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                            <div>
                              <h4 className="font-semibold text-sm text-muted-foreground mb-1">Writer</h4>
                              <p className="text-sm">{writer?.name}</p>
                              <p className="text-xs text-muted-foreground">{writer?.email}</p>
                            </div>
                            <div>
                              <h4 className="font-semibold text-sm text-muted-foreground mb-1">Student</h4>
                              <p className="text-sm">{student?.name}</p>
                              <p className="text-xs text-muted-foreground">{student?.email}</p>
                            </div>
                          </div>
                          
                          <div className="space-y-2 max-h-60 overflow-y-auto">
                            {chat.messages.slice(0, 10).map((message) => (
                              <div
                                key={message.id}
                                className={`p-3 rounded-lg ${
                                  message.sender.role === 'writer' 
                                    ? 'bg-primary/10 border-l-4 border-primary' 
                                    : 'bg-muted/50 border-l-4 border-muted-foreground'
                                }`}
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <span className="font-medium text-sm">
                                    {message.sender.name}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {formatDate(message.timestamp)}
                                  </span>
                                </div>
                                <p className="text-sm text-foreground">{message.content}</p>
                                {message.fileName && (
                                  <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                                    <FileText className="w-3 h-3" />
                                    {message.fileName}
                                  </div>
                                )}
                              </div>
                            ))}
                            {chat.messages.length > 10 && (
                              <p className="text-xs text-muted-foreground text-center py-2">
                                ... and {chat.messages.length - 10} more messages
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    )}
                  </Card>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="h-full overflow-y-auto p-6">
            {selectedChat ? (
              <div>
                {/* Detailed chat view */}
                <h3 className="text-xl font-bold mb-4">Chat Details</h3>
                {/* Implementation for detailed view */}
              </div>
            ) : (
              <div className="text-center py-12">
                <MessageSquare className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Select a Chat</h3>
                <p className="text-muted-foreground">Choose a chat from the list to view detailed information.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatDataViewer;
