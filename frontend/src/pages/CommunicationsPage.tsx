import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  MessageSquare,
  Mail,
  Phone,
  Users,
  Send,
  Search,
  Smartphone,
  Loader2,
  UserCog,
  RefreshCw,
  ArrowLeft,
  Building2,
  ShieldCheck,
  MessageCircle,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { UnifiedInboxWorkspace } from "@/components/inbox/UnifiedInboxWorkspace";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { socket } from "@/lib/socket";
import { getCustomers } from "@/api/customerApi";
import {
  getCustomerCommunications,
  createCustomerCommunication,
  getEmployeeCommunications,
  createEmployeeCommunication,
} from "@/api/communicationApi";
import { getEmployees } from "@/api/employeeApi";
import {
  getWhatsAppConversations,
  getWhatsAppConversationDetail,
  sendWhatsAppOutboundMessage,
  pauseWhatsAppAutomation,
  resumeWhatsAppAutomation,
  getWhatsAppTemplates,
  WhatsAppConversation,
  WhatsAppMessage,
  WhatsAppTemplateItem,
} from "@/api/whatsappApi";

type TabType = "customers" | "employees" | "adminSupport" | "whatsapp";

interface CurrentUser {
  _id: string;
  role: string;
  name: string;
  email?: string;
}

interface Contact {
  _id: string;
  name: string;
  phone?: string;
  email?: string;
  role?: string;
  branchId?: string;
  status?: string;
  companyName?: string;
  businessName?: string;
  assignedTo?: string | { _id: string };
}

interface Communication {
  _id: string;
  channel: string;
  direction: string;
  subject?: string;
  message: string;
  byName: string;
  createdAt: string;
  customerId?: string;
  employeeId?: string;
}

const channelIcon: Record<string, any> = {
  WhatsApp: MessageSquare,
  Email: Mail,
  Call: Phone,
  Meeting: Users,
  SMS: Smartphone,
};

const getCurrentUser = (): CurrentUser | null => {
  try {
    const stored = localStorage.getItem("user");
    if (!stored) return null;

    const user = JSON.parse(stored);
    const id = user._id || user.id || user.userId || user.uid;

    if (!id) return null;

    return {
      _id: id,
      role: user.role,
      name: user.name,
      email: user.email,
    };
  } catch {
    return null;
  }
};

const getToken = () => localStorage.getItem("token");

const getContactSubtitle = (contact: Contact, activeTab: TabType) => {
  if (activeTab === "employees" || activeTab === "adminSupport") {
    return contact.role || contact.email || "Employee";
  }

  return (
    contact.companyName ||
    contact.businessName ||
    contact.phone ||
    contact.email ||
    "Customer"
  );
};

const getInitial = (name?: string) => name?.charAt(0)?.toUpperCase() || "U";

const formatMessageTime = (date: string) => {
  try {
    return new Date(date).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
};

const formatMessageDate = (date: string) => {
  try {
    return new Date(date).toLocaleDateString([], {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "";
  }
};

const isSameDay = (a: string, b: string) => {
  try {
    return new Date(a).toDateString() === new Date(b).toDateString();
  } catch {
    return false;
  }
};

export default function CommunicationsPage() {
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentUser = getCurrentUser();
  const userId = currentUser?._id;

  const isAdminOrManager =
    currentUser?.role === "Admin" ||
    currentUser?.role === "Operational Manager";

  const [viewMode, setViewMode] = useState<"unified" | "classic">("unified");
  const [activeTab, setActiveTab] = useState<TabType>("customers");

  const [allCustomers, setAllCustomers] = useState<Contact[]>([]);
  const [customersLoading, setCustomersLoading] = useState(false);

  const [employees, setEmployees] = useState<Contact[]>([]);
  const [employeesLoading, setEmployeesLoading] = useState(false);

  const [adminContact, setAdminContact] = useState<Contact | null>(null);

  const [selectedId, setSelectedId] = useState("");
  const [search, setSearch] = useState("");

  const [messages, setMessages] = useState<Communication[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sending, setSending] = useState(false);

  const [mobileChatOpen, setMobileChatOpen] = useState(false);

  const [form, setForm] = useState({
    channel: "WhatsApp",
    direction: "Outbound",
    subject: "",
    message: "",
  });

  useEffect(() => {
    if (!getToken() || !userId) {
      toast.error("Please login to access communications");
      navigate("/login");
    }
  }, [navigate, userId]);

  const customers = useMemo(() => {
    return allCustomers.filter((customer) => {
      if (isAdminOrManager) return true;

      const assigneeId =
        typeof customer.assignedTo === "object"
          ? customer.assignedTo?._id
          : customer.assignedTo;

      return assigneeId === userId;
    });
  }, [allCustomers, isAdminOrManager, userId]);

  const tabsForRole = isAdminOrManager
    ? [
        { value: "customers" as TabType, label: "Customers", icon: Users },
        { value: "employees" as TabType, label: "Employees", icon: UserCog },
        { value: "whatsapp" as TabType, label: "WhatsApp Leads", icon: MessageCircle },
      ]
    : [
        { value: "customers" as TabType, label: "My Customers", icon: Users },
        {
          value: "adminSupport" as TabType,
          label: "Admin Support",
          icon: ShieldCheck,
        },
        { value: "whatsapp" as TabType, label: "WhatsApp Leads", icon: MessageCircle },
      ];

  const [whatsAppConversations, setWhatsAppConversations] = useState<WhatsAppConversation[]>([]);
  const [whatsAppLoading, setWhatsAppLoading] = useState(false);
  const [selectedWhatsApp, setSelectedWhatsApp] = useState<WhatsAppConversation | null>(null);
  const [whatsAppMessages, setWhatsAppMessages] = useState<WhatsAppMessage[]>([]);
  const [whatsAppTemplates, setWhatsAppTemplates] = useState<WhatsAppTemplateItem[]>([]);
  const [selectedTemplateName, setSelectedTemplateName] = useState("");

  const contacts = useMemo(() => {
    if (activeTab === "customers") return customers;
    if (activeTab === "employees") return employees;
    if (activeTab === "adminSupport") return adminContact ? [adminContact] : [];
    if (activeTab === "whatsapp") {
      return whatsAppConversations.map((c) => ({
        _id: c._id,
        name: c.leadId?.name || c.participantWaId,
        phone: c.participantWaId,
        companyName: c.customerId?.brandName || c.customerId?.companyName || c.customerId?.name || "Client",
        role: `Score: ${c.qualificationSummary?.qualificationScore || 50} • State: ${c.state}`,
        status: c.windowStatus?.isOpen ? "Active" : "Closed",
        rawConv: c,
      }));
    }
    return [];
  }, [activeTab, customers, employees, adminContact, whatsAppConversations]);

  const selectedContact = useMemo(
    () => contacts.find((contact) => contact._id === selectedId),
    [contacts, selectedId]
  );

  const filteredContacts = useMemo(() => {
    const keyword = search.toLowerCase().trim();

    if (!keyword) return contacts;

    return contacts.filter((contact) => {
      return (
        contact.name?.toLowerCase().includes(keyword) ||
        contact.phone?.toLowerCase().includes(keyword) ||
        contact.email?.toLowerCase().includes(keyword) ||
        contact.role?.toLowerCase().includes(keyword) ||
        contact.companyName?.toLowerCase().includes(keyword) ||
        contact.businessName?.toLowerCase().includes(keyword)
      );
    });
  }, [contacts, search]);

  const fetchCustomers = useCallback(async () => {
    if (!userId) return;

    try {
      setCustomersLoading(true);
      const data = await getCustomers();
      setAllCustomers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Fetch customers error:", error);
      toast.error("Failed to fetch customers");
    } finally {
      setCustomersLoading(false);
    }
  }, [userId]);

  const fetchEmployees = useCallback(async () => {
    if (!isAdminOrManager || !userId) return;

    try {
      setEmployeesLoading(true);
      const data = await getEmployees();
      setEmployees(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Fetch employees error:", error);
      toast.error("Failed to fetch employees");
    } finally {
      setEmployeesLoading(false);
    }
  }, [isAdminOrManager, userId]);

  const fetchAdminContact = useCallback(async () => {
    if (isAdminOrManager || !userId) return;

    try {
      const data = await getEmployees();
      const users = Array.isArray(data) ? data : [];

      const admin =
        users.find((user: any) => user.role === "Admin") ||
        users.find((user: any) => user.role === "Operational Manager");

      if (admin) {
        setAdminContact(admin);
      } else {
        toast.error("No admin or manager user found");
      }
    } catch (error) {
      console.error("Fetch admin contact error:", error);
      toast.error("Failed to load admin support contact");
    }
  }, [isAdminOrManager, userId]);

  const getMessageTargetId = useCallback(() => {
    if (activeTab === "adminSupport") return userId || "";
    return selectedId;
  }, [activeTab, selectedId, userId]);

  const fetchWhatsApp = useCallback(async () => {
    try {
      setWhatsAppLoading(true);
      const data = await getWhatsAppConversations();
      const list = data?.conversations || [];
      setWhatsAppConversations(list);
      if (list.length > 0 && (!selectedId || !list.some((c: any) => c._id === selectedId))) {
        setSelectedId(list[0]._id);
      }
    } catch (err: any) {
      console.error("Fetch WhatsApp error:", err);
    } finally {
      setWhatsAppLoading(false);
    }
  }, [selectedId]);

  const fetchWhatsAppDetail = useCallback(async () => {
    if (!selectedId || activeTab !== "whatsapp") return;
    try {
      setMessagesLoading(true);
      const data = await getWhatsAppConversationDetail(selectedId);
      setSelectedWhatsApp(data?.conversation || null);
      setWhatsAppMessages(data?.messages || []);
      if (data?.conversation?.customerId?._id) {
        const tmplData = await getWhatsAppTemplates({ customerId: data.conversation.customerId._id });
        setWhatsAppTemplates(tmplData?.templates || []);
      }
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } catch (err: any) {
      console.error("Fetch WhatsApp detail error:", err);
    } finally {
      setMessagesLoading(false);
    }
  }, [selectedId, activeTab]);

  const fetchMessages = useCallback(async () => {
    if (activeTab === "whatsapp") {
      return fetchWhatsAppDetail();
    }

    const targetId = getMessageTargetId();

    if (!targetId || !userId) return;

    try {
      setMessagesLoading(true);

      const data =
        activeTab === "customers"
          ? await getCustomerCommunications(targetId)
          : await getEmployeeCommunications(targetId);

      setMessages(Array.isArray(data) ? data : []);

      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } catch (error) {
      console.error("Fetch messages error:", error);
      toast.error("Failed to load messages");
    } finally {
      setMessagesLoading(false);
    }
  }, [activeTab, getMessageTargetId, userId, fetchWhatsAppDetail]);

  useEffect(() => {
    if (!userId) return;

    if (activeTab === "whatsapp") {
      fetchWhatsApp();
    } else {
      fetchCustomers();
      if (isAdminOrManager) {
        fetchEmployees();
      } else {
        fetchAdminContact();
      }
    }
  }, [userId, activeTab, isAdminOrManager, fetchCustomers, fetchEmployees, fetchAdminContact, fetchWhatsApp]);

  useEffect(() => {
    if (!userId) return;

    if (activeTab === "customers" && customers.length > 0) {
      if (!selectedId || !customers.some((c) => c._id === selectedId)) {
        setSelectedId(customers[0]._id);
      }
    } else if (activeTab === "employees" && employees.length > 0) {
      if (!selectedId || !employees.some((e) => e._id === selectedId)) {
        setSelectedId(employees[0]._id);
      }
    } else if (activeTab === "adminSupport" && adminContact) {
      if (selectedId !== adminContact._id) {
        setSelectedId(adminContact._id);
      }
    } else {
      setSelectedId("");
    }

    setSearch("");
    setMessages([]);
    setMobileChatOpen(false);
  }, [activeTab, customers, employees, adminContact, selectedId, userId]);

  useEffect(() => {
    if (selectedId && userId) {
      fetchMessages();
    }
  }, [selectedId, userId, fetchMessages]);

  useEffect(() => {
    if (!selectedId || !userId) return;

    const room =
      activeTab === "customers"
        ? `customer_${selectedId}`
        : activeTab === "employees"
        ? `employee_${selectedId}`
        : activeTab === "adminSupport"
        ? `employee_${userId}`
        : "";

    if (!room) return;

    socket.emit("join_room", room);

    const handleNewMessage = (newMessage: Communication) => {
      let belongs = false;

      if (activeTab === "customers") {
        belongs = newMessage.customerId === selectedId;
      } else if (activeTab === "employees") {
        belongs = newMessage.employeeId === selectedId;
      } else if (activeTab === "adminSupport") {
        belongs = newMessage.employeeId === userId;
      }

      if (!belongs) return;

      setMessages((prev) => {
        const exists = prev.some((msg) => msg._id === newMessage._id);
        return exists ? prev : [...prev, newMessage];
      });

      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    };

    socket.on("new_communication", handleNewMessage);

    return () => {
      socket.emit("leave_room", room);
      socket.off("new_communication", handleNewMessage);
    };
  }, [selectedId, activeTab, userId]);

  const handleContactSelect = (contactId: string) => {
    setSelectedId(contactId);
    setMobileChatOpen(true);
  };

  const handleSubmit = async () => {
    if (!selectedId || !userId) {
      toast.error("Please select a contact");
      return;
    }

    if (!form.message.trim()) {
      toast.error("Enter a message");
      return;
    }

    if (form.channel === "Email" && !form.subject.trim()) {
      toast.error("Please enter email subject");
      return;
    }

    try {
      setSending(true);

      if (activeTab === "whatsapp") {
        const windowIsOpen = selectedWhatsApp?.windowStatus?.isOpen;
        if (!windowIsOpen && !selectedTemplateName) {
          toast.error("24h service window closed. Please select an approved WhatsApp template.");
          setSending(false);
          return;
        }

        const payload = windowIsOpen
          ? { messageType: "TEXT", text: form.message }
          : { messageType: "TEMPLATE", templateName: selectedTemplateName };

        const res = await sendWhatsAppOutboundMessage(selectedId, payload);
        toast.success(`WhatsApp message created (${res.approvalId})! Submitted for R2 Approval.`);
        setForm((prev) => ({ ...prev, message: "" }));
        await fetchWhatsAppDetail();
        setSending(false);
        return;
      }

      let savedMessage: Communication;

      if (activeTab === "customers") {
        savedMessage = await createCustomerCommunication({
          customerId: selectedId,
          channel: form.channel,
          direction: form.direction,
          subject: form.subject,
          message: form.message,
        });
      } else {
        const employeeId = activeTab === "employees" ? selectedId : userId;

        savedMessage = await createEmployeeCommunication({
          employeeId,
          channel: form.channel,
          direction: form.direction,
          subject: form.subject,
          message: form.message,
        });
      }

      setMessages((prev) => [...prev, savedMessage]);

      setForm((prev) => ({
        ...prev,
        subject: "",
        message: "",
      }));

      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);

      toast.success("Message sent");
    } catch (error: any) {
      console.error("Send message error:", error);
      toast.error(error?.response?.data?.message || error.message || "Failed to send");
    } finally {
      setSending(false);
    }
  };

  const noAssignedCustomers = !isAdminOrManager && customers.length === 0;

  const loadingContacts =
    activeTab === "customers"
      ? customersLoading
      : activeTab === "employees"
      ? employeesLoading
      : !adminContact && !isAdminOrManager;

  const renderContactList = () => (
    <aside
      className={`
        h-full
        min-h-0
        overflow-hidden
        border-r
        bg-muted/20
        flex
        flex-col
        ${mobileChatOpen ? "hidden lg:flex" : "flex"}
      `}
    >
      <div className="shrink-0 border-b bg-background/70 p-3 sm:p-4">
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as TabType)}
          className="mb-3"
        >
          <TabsList
            className="grid w-full"
            style={{
              gridTemplateColumns: `repeat(${tabsForRole.length}, minmax(0, 1fr))`,
            }}
          >
            {tabsForRole.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="gap-1 text-xs sm:text-sm"
              >
                <tab.icon className="h-4 w-4" />
                <span className="hidden min-[420px]:inline">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search contacts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 pl-9 sm:h-10"
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {loadingContacts && (
          <div className="flex justify-center p-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {!loadingContacts && activeTab === "customers" && noAssignedCustomers && (
          <div className="flex flex-col items-center justify-center gap-2 p-8 text-center text-sm text-muted-foreground">
            <Building2 className="h-10 w-10 opacity-40" />
            <p>No customers assigned to you.</p>
          </div>
        )}

        {!loadingContacts && filteredContacts.length === 0 && !noAssignedCustomers && (
          <div className="flex flex-col items-center justify-center gap-2 p-8 text-center text-sm text-muted-foreground">
            <Search className="h-10 w-10 opacity-40" />
            <p>No contacts found.</p>
          </div>
        )}

        {filteredContacts.map((contact) => {
          const active = contact._id === selectedId;

          return (
            <button
              key={contact._id}
              onClick={() => handleContactSelect(contact._id)}
              className={`flex w-full items-center gap-3 border-l-4 p-3 text-left transition-all sm:p-4 ${
                active
                  ? "border-primary bg-primary/10"
                  : "border-transparent hover:bg-muted/60"
              }`}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15 font-semibold text-primary">
                {getInitial(contact.name)}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate font-medium">{contact.name}</p>

                  {contact.status === "Active" && (
                    <span className="h-2 w-2 shrink-0 rounded-full bg-green-500" />
                  )}
                </div>

                <p className="truncate text-xs text-muted-foreground">
                  {getContactSubtitle(contact, activeTab)}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </aside>
  );

  const renderChat = () => (
    <section
      className={`
        h-full
        min-h-0
        overflow-hidden
        flex-col
        bg-gradient-to-b
        from-gray-50
        to-white
        dark:from-gray-950
        dark:to-gray-900
        ${mobileChatOpen ? "flex" : "hidden lg:flex"}
      `}
    >
      {selectedContact ? (
        <>
          <div className="flex shrink-0 items-center justify-between gap-3 border-b bg-background/95 p-3 shadow-sm backdrop-blur">
            <div className="flex min-w-0 items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setMobileChatOpen(false)}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground">
                {getInitial(selectedContact.name)}
              </div>

              <div className="min-w-0">
                <h2 className="truncate text-base font-semibold sm:text-lg">
                  {selectedContact.name}
                </h2>
                <p className="truncate text-xs text-muted-foreground">
                  {getContactSubtitle(selectedContact, activeTab)}
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {activeTab === "whatsapp" && selectedWhatsApp && (
                <>
                  <Badge
                    variant="outline"
                    className={
                      selectedWhatsApp.windowStatus?.isOpen
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
                        : "border-amber-500/30 bg-amber-500/10 text-amber-600"
                    }
                  >
                    24h Window: {selectedWhatsApp.windowStatus?.isOpen ? `OPEN (${selectedWhatsApp.windowStatus?.remainingMinutes}m)` : "CLOSED"}
                  </Badge>

                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={async () => {
                      if (selectedWhatsApp.automationMode === "AUTOMATED") {
                        await pauseWhatsAppAutomation(selectedWhatsApp._id);
                        toast.success("Automation paused. Human takeover active.");
                      } else {
                        await resumeWhatsAppAutomation(selectedWhatsApp._id);
                        toast.success("Automation resumed.");
                      }
                      fetchWhatsAppDetail();
                    }}
                  >
                    {selectedWhatsApp.automationMode === "AUTOMATED" ? "Takeover" : "Resume Auto"}
                  </Button>
                </>
              )}

              <Button
                variant="ghost"
                size="icon"
                onClick={fetchMessages}
                title="Refresh messages"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3 sm:p-4">
            {messagesLoading && (
              <div className="flex justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            )}

            {/* Render WhatsApp Messages */}
            {activeTab === "whatsapp" && (
              <>
                {!messagesLoading && whatsAppMessages.length === 0 && (
                  <div className="flex h-full flex-col items-center justify-center text-center">
                    <MessageCircle className="h-10 w-10 text-muted-foreground/40" />
                    <p className="mt-2 text-sm text-muted-foreground">No WhatsApp messages yet</p>
                  </div>
                )}

                {whatsAppMessages.map((msg) => {
                  const isOutbound = msg.direction === "OUTBOUND";
                  return (
                    <div key={msg._id} className={`flex ${isOutbound ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[85%] rounded-2xl px-3 py-2 shadow-sm ${
                          isOutbound
                            ? "rounded-br-md bg-primary text-primary-foreground"
                            : "rounded-bl-md border bg-white text-foreground dark:bg-gray-800"
                        }`}
                      >
                        <div className="mb-1 flex items-center justify-between gap-2 text-[10px]">
                          <Badge variant={isOutbound ? "secondary" : "outline"} className="h-4 px-1 text-[9px]">
                            {msg.messageType}
                          </Badge>
                          {isOutbound && (
                            <span className="opacity-80">
                              {msg.status === "READ" ? "✓✓ Read" : msg.status === "DELIVERED" ? "✓✓ Delivered" : msg.status}
                            </span>
                          )}
                        </div>

                        {msg.template?.name && (
                          <div className="mb-1 text-xs font-semibold underline">
                            Template: {msg.template.name}
                          </div>
                        )}

                        <p className="whitespace-pre-wrap break-words text-sm">{msg.text || (msg.interactive?.button_reply?.title ? `[Selected: ${msg.interactive.button_reply.title}]` : "")}</p>

                        <div className={`mt-1 flex justify-end text-[10px] ${isOutbound ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                          {formatMessageTime(msg.createdAt)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </>
            )}

            {/* Render Standard CRM Communications */}
            {activeTab !== "whatsapp" && (
              <>
                {!messagesLoading && messages.length === 0 && (
                  <div className="flex h-full flex-col items-center justify-center text-center">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted/50">
                      <MessageCircle className="h-8 w-8 text-muted-foreground/50" />
                    </div>

                    <p className="font-medium text-muted-foreground">No messages yet</p>

                    <p className="mt-1 text-sm text-muted-foreground">
                      Send a message to start the conversation.
                    </p>
                  </div>
                )}

                {messages.map((msg, index) => {
                  const Icon = channelIcon[msg.channel] || MessageSquare;
                  const isOutbound = msg.direction === "Outbound";
                  const previous = messages[index - 1];
                  const showDate =
                    !previous || !isSameDay(previous.createdAt, msg.createdAt);

                  return (
                    <div key={msg._id} className="flex flex-col">
                      {showDate && (
                        <div className="my-3 text-center">
                          <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                            {formatMessageDate(msg.createdAt)}
                          </span>
                        </div>
                      )}

                      <div className={`flex ${isOutbound ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`max-w-[88%] rounded-2xl px-3 py-2 shadow-sm sm:max-w-[75%] md:max-w-[65%] ${
                            isOutbound
                              ? "rounded-br-md bg-primary text-primary-foreground"
                              : "rounded-bl-md border bg-white text-foreground dark:bg-gray-800"
                          }`}
                        >
                          {!isOutbound && (
                            <div className="mb-1 text-xs font-semibold text-primary">
                              {msg.byName}
                            </div>
                          )}

                          <div className="mb-1 flex items-center gap-1">
                            <Badge
                              variant={isOutbound ? "secondary" : "outline"}
                              className="h-4 gap-1 px-1 py-0 text-[10px]"
                            >
                              <Icon className="h-2.5 w-2.5" />
                              {msg.channel}
                            </Badge>
                          </div>

                          {msg.subject && (
                            <div className="mb-1 text-sm font-semibold">
                              {msg.subject}
                            </div>
                          )}

                          <p className="whitespace-pre-wrap break-words text-sm">
                            {msg.message}
                          </p>

                          <div
                            className={`mt-1 flex justify-end text-[10px] ${
                              isOutbound
                                ? "text-primary-foreground/70"
                                : "text-muted-foreground"
                            }`}
                          >
                            {formatMessageTime(msg.createdAt)}
                            {isOutbound && <span className="ml-1.5">✓</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div className="shrink-0 space-y-2 border-t bg-background/95 p-3 backdrop-blur">
            {activeTab === "whatsapp" ? (
              <div className="space-y-2">
                {!selectedWhatsApp?.windowStatus?.isOpen ? (
                  <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-2.5 text-xs text-amber-800 dark:text-amber-300">
                    <p className="font-semibold">⚠️ 24-Hour Customer Service Window Closed</p>
                    <p className="mt-0.5">Meta requires an approved WhatsApp Template for business-initiated conversations outside the 24-hour window.</p>
                    
                    <div className="mt-2 flex items-center gap-2">
                      <Select value={selectedTemplateName} onValueChange={setSelectedTemplateName}>
                        <SelectTrigger className="h-8 bg-background text-xs">
                          <SelectValue placeholder="Select Approved Template" />
                        </SelectTrigger>
                        <SelectContent>
                          {whatsAppTemplates.map((t) => (
                            <SelectItem key={t._id} value={t.name}>
                              {t.name} ({t.category} • {t.status})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Button size="sm" onClick={handleSubmit} disabled={sending || !selectedTemplateName} className="h-8">
                        {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Send Template (R2)"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-end gap-2">
                    <Textarea
                      rows={2}
                      placeholder="Type custom reply (Submits for R2 Approval)..."
                      value={form.message}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, message: e.target.value }))
                      }
                      className="min-h-[52px] resize-none text-sm"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSubmit();
                        }
                      }}
                    />

                    <Button
                      onClick={handleSubmit}
                      disabled={sending}
                      className="h-10 shrink-0 px-4"
                    >
                      {sending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                      <span className="ml-2 hidden sm:inline">Send (R2)</span>
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  <Select
                    value={form.channel}
                    onValueChange={(value) =>
                      setForm((prev) => ({ ...prev, channel: value }))
                    }
                  >
                    <SelectTrigger className="h-9 text-sm sm:h-10">
                      <SelectValue placeholder="Channel" />
                    </SelectTrigger>
                    <SelectContent>
                      {["WhatsApp", "Email", "Call", "Meeting", "SMS"].map(
                        (channel) => (
                          <SelectItem key={channel} value={channel}>
                            {channel}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>

                  <Select
                    value={form.direction}
                    onValueChange={(value) =>
                      setForm((prev) => ({ ...prev, direction: value }))
                    }
                  >
                    <SelectTrigger className="h-9 text-sm sm:h-10">
                      <SelectValue placeholder="Direction" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Outbound">Outbound</SelectItem>
                      <SelectItem value="Inbound">Inbound</SelectItem>
                    </SelectContent>
                  </Select>

                  {form.channel === "Email" && (
                    <Input
                      placeholder="Subject"
                      value={form.subject}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, subject: e.target.value }))
                      }
                      className="col-span-2 h-9 text-sm sm:col-span-1 sm:h-10"
                    />
                  )}
                </div>

                <div className="flex items-end gap-2">
                  <Textarea
                    rows={2}
                    placeholder="Type a message..."
                    value={form.message}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, message: e.target.value }))
                    }
                    className="min-h-[52px] resize-none text-sm"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmit();
                      }
                    }}
                  />

                  <Button
                    onClick={handleSubmit}
                    disabled={sending}
                    className="h-10 shrink-0 px-4"
                  >
                    {sending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}

                    <span className="ml-2 hidden sm:inline">Send</span>
                  </Button>
                </div>
              </>
            )}
          </div>
        </>
      ) : (
        <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center text-muted-foreground">
          <Users className="h-12 w-12 opacity-30" />
          <p>Select a contact to start chatting</p>
        </div>
      )}
    </section>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        height: "calc(100dvh - 72px)",
      }}
      className="flex min-h-0 flex-col overflow-hidden bg-background p-2 sm:p-3 lg:p-4"
    >
      <div className="shrink-0 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Communications
          </h1>

          <p className="text-sm text-muted-foreground sm:text-base">
            Unified multi-channel lead operations, WhatsApp conversations, GBP reviews, and team SLAs.
          </p>
        </div>

        <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-xl gap-1 shrink-0">
          <button
            onClick={() => setViewMode("unified")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              viewMode === "unified" ? "bg-indigo-600 text-white shadow" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Zap className="w-3.5 h-3.5" /> Unified Operations Inbox
          </button>
          <button
            onClick={() => setViewMode("classic")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              viewMode === "classic" ? "bg-slate-800 text-white shadow" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" /> Classic Direct Chats
          </button>
        </div>
      </div>

      {viewMode === "unified" ? (
        <div className="flex-1 min-h-0 overflow-hidden">
          <UnifiedInboxWorkspace />
        </div>
      ) : (
        <Card className="min-h-0 flex-1 overflow-hidden rounded-2xl border bg-card shadow-md">
          <div className="grid h-full min-h-0 grid-cols-1 overflow-hidden lg:grid-cols-[360px_minmax(0,1fr)]">
            {renderContactList()}
            {renderChat()}
          </div>
        </Card>
      )}
    </motion.div>
  );
}