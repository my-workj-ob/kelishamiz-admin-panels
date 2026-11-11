import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Table from "./../components/Table";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "./../config/auth/api";
import { get, isArray } from "lodash";
import {
  message,
  Popconfirm,
  Tooltip,
  Select,
  Tag,
  Button,
  Modal,
  Input,
  Radio,
  Switch,
  Space,
  Avatar,
  Row,
  Col,
  Tabs,
} from "antd";
import dayjs from "dayjs";
import {
  Users as UsersIcon,
  User,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Send,
  Ban,
  Trash2,
  Eye,
  Search,
  Phone,
  Calendar,
  Wallet,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  ExternalLink,
  Lock,
  ShoppingBag,
  Store,
  Key,
  UserPlus,
} from "lucide-react";
import { CompactStatCard } from "../components/CompactStatCard";
import CreateAdminModal from "../components/CreateAdminModal";
import AdminCredentialsModal from "../components/AdminCredentialsModal";

const { Option } = Select;
const { TextArea } = Input;

const UserRole = {
  USER: "USER",
  ADMIN: "ADMIN",
  SUPER_ADMIN: "SUPER_ADMIN",
  MODERATOR: "MODERATOR",
  SUPPORT: "SUPPORT",
};

const Users = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleTab, setRoleTab] = useState("all");
  const [updatingRoleId, setUpdatingRoleId] = useState(null);

  const { data: meData } = useQuery({
    queryKey: ["admin-me"],
    queryFn: async () => {
      try {
        const res = await api.get("/admin/auth/me");
        return res.data?.content || res.data;
      } catch {
        return null;
      }
    },
    staleTime: 60000,
  });
  const currentAdminRole = meData?.role || meData?.content?.role || "ADMIN";

  // Modals state
  const [messageModalVisible, setMessageModalVisible] = useState(false);
  const [moderationModalVisible, setModerationModalVisible] = useState(false);
  const [createAdminModalVisible, setCreateAdminModalVisible] = useState(false);
  const [editCredsModalVisible, setEditCredsModalVisible] = useState(false);
  const [userForCreds, setUserForCreds] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

  const openEditCredsModal = (user) => {
    setUserForCreds(user);
    setEditCredsModalVisible(true);
  };

  // Direct Message states
  const [msgTitle, setMsgTitle] = useState("Kelishamiz.uz Xabarnomasi");
  const [msgBody, setMsgBody] = useState("");

  // Moderation states
  const [modIsBlocked, setModIsBlocked] = useState(false);
  const [modBlockDuration, setModBlockDuration] = useState("24h");
  const [modBanReason, setModBanReason] = useState("");
  const [modIsSpam, setModIsSpam] = useState(false);
  const [modSpamDuration, setModSpamDuration] = useState("24h");
  const [modSpamReason, setModSpamReason] = useState("");
  const [modSendNotification, setModSendNotification] = useState(true);
  const [modNotificationMessage, setModNotificationMessage] = useState("");

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin-users", page, pageSize, searchTerm, roleTab],
    queryFn: async () => {
      let roleParam = "";
      let statusParam = "";
      if (roleTab === "admin") roleParam = "ADMIN";
      else if (roleTab === "user") roleParam = "USER";
      else if (roleTab === "blocked") statusParam = "blocked";
      else if (roleTab === "spam") statusParam = "spam";
      else if (roleTab === "active") statusParam = "active";
      else if (roleTab === "bot") statusParam = "bot";
      else if (roleTab === "channel") statusParam = "channel";

      const response = await api.get("/admin/users", {
        params: {
          page,
          limit: pageSize,
          search: searchTerm ? searchTerm.trim() : undefined,
          role: roleParam || undefined,
          status: statusParam || undefined,
          telegram: roleTab === "bot" || roleTab === "channel" ? roleTab : undefined,
        },
      });
      return response.data?.content || response.data;
    },
    retry: 2,
    keepPreviousData: true,
  });

  const userItems = useMemo(() => {
    return data?.data || data?.content?.users || data?.users || [];
  }, [data]);
  const totalUsers = data?.total ?? data?.content?.total ?? 0;
  const currentPage = data?.page ?? page;

  // Stats calculation
  const stats = useMemo(() => {
    const total = totalUsers || userItems.length;
    const admins = userItems.filter((u) => u.role === "ADMIN" || u.role === "SUPER_ADMIN").length;
    const blocked = userItems.filter((u) => u.isBlocked).length;
    const spam = userItems.filter((u) => u.isSpam).length;

    return {
      total,
      admins,
      blocked,
      spam,
      active: total - blocked,
    };
  }, [userItems, totalUsers]);

  const { mutate: updateUserRole } = useMutation({
    mutationFn: async ({ id, newRole }) => {
      setUpdatingRoleId(id);
      const response = await api.patch(`/admin/users/${id}/role`, { role: newRole });
      return response.data;
    },
    onSuccess: (res) => {
      message.success(res?.message || "Foydalanuvchi roli muvaffaqiyatli yangilandi");
      refetch();
    },
    onError: (err) => {
      const errorMsg =
        err?.response?.data?.message ||
        "Foydalanuvchi rolini yangilashda xatolik yuz berdi.";
      message.error(errorMsg);
      refetch();
    },
    onSettled: () => {
      setUpdatingRoleId(null);
    },
  });

  const { mutate: deleteUser } = useMutation({
    mutationFn: async (id) => {
      const response = await api.delete(`/users/${id}`);
      return response.data;
    },
    onSuccess: () => {
      message.success("Foydalanuvchi muvaffaqiyatli o'chirildi");
      refetch();
    },
    onError: () => {
      message.error("Foydalanuvchini o'chirishda xatolik yuz berdi.");
    },
  });

  const directMessageMutation = useMutation({
    mutationFn: async ({ userId, title, message: msgText }) => {
      const res = await api.post(`/admin/users/${userId}/notify`, {
        title,
        message: msgText,
      });
      return res.data;
    },
    onSuccess: () => {
      message.success("Xabarnoma muvaffaqiyatli yuborildi!");
      setMessageModalVisible(false);
      setMsgBody("");
    },
    onError: () => {
      message.error("Xabarnomani yuborishda xatolik yuz berdi");
    },
  });

  const userModerationMutation = useMutation({
    mutationFn: async ({ userId, payload }) => {
      const res = await api.patch(`/admin/users/${userId}/moderation`, payload);
      return res.data;
    },
    onSuccess: () => {
      message.success("Foydalanuvchi moderatsiya holati yangilandi!");
      setModerationModalVisible(false);
      setSelectedUser(null);
      refetch();
    },
    onError: () => {
      message.error("Foydalanuvchi holatini yangilashda xatolik yuz berdi");
    },
  });

  const openMessageModal = (user) => {
    setSelectedUser(user);
    setMsgTitle("Kelishamiz.uz Xabarnomasi");
    setMsgBody("");
    setMessageModalVisible(true);
  };

  const openModerationModal = (user) => {
    setSelectedUser(user);
    setModIsBlocked(user.isBlocked || false);
    setModBlockDuration("24h");
    setModBanReason(user.banReason || "");
    setModIsSpam(user.isSpam || false);
    setModSpamDuration("24h");
    setModSpamReason(user.spamReason || "");
    setModSendNotification(true);
    setModNotificationMessage("Hisobingiz bo'yicha moderatsiya cheklovi o'rnatildi.");
    setModerationModalVisible(true);
  };

  const handleModerationSubmit = () => {
    if (!selectedUser) return;

    let blockedUntil = null;
    if (modIsBlocked) {
      if (modBlockDuration === "24h") blockedUntil = new Date(Date.now() + 24 * 3600 * 1000).toISOString();
      else if (modBlockDuration === "3d") blockedUntil = new Date(Date.now() + 72 * 3600 * 1000).toISOString();
      else if (modBlockDuration === "7d") blockedUntil = new Date(Date.now() + 168 * 3600 * 1000).toISOString();
      else if (modBlockDuration === "30d") blockedUntil = new Date(Date.now() + 720 * 3600 * 1000).toISOString();
    }

    let spamUntil = null;
    if (modIsSpam) {
      if (modSpamDuration === "24h") spamUntil = new Date(Date.now() + 24 * 3600 * 1000).toISOString();
      else if (modSpamDuration === "7d") spamUntil = new Date(Date.now() + 168 * 3600 * 1000).toISOString();
    }

    userModerationMutation.mutate({
      userId: selectedUser.id,
      payload: {
        isBlocked: modIsBlocked,
        blockedUntil,
        banReason: modBanReason || (modIsBlocked ? "Qoidabuzarlik sababli" : null),
        isSpam: modIsSpam,
        spamUntil,
        spamReason: modSpamReason || (modIsSpam ? "Spam tarqatish" : null),
        sendNotification: modSendNotification,
        notificationMessage: modNotificationMessage,
      },
    });
  };

  const filteredUsers = useMemo(() => {
    return userItems.filter((u) => {
      if (roleTab === "admin" && u.role !== "ADMIN") return false;
      if (roleTab === "user" && u.role !== "USER") return false;
      if (roleTab === "blocked" && !u.isBlocked) return false;
      if (roleTab === "spam" && !u.isSpam) return false;
      if (roleTab === "bot" && !u.hasTelegramBot && !u.telegram_chat_id) return false;
      if (roleTab === "channel" && !u.hasTelegramChannel && !u.telegram_channel_id) return false;

      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        return (
          u.username?.toLowerCase().includes(term) ||
          u.phone?.toLowerCase().includes(term) ||
          u.id?.toString().includes(term)
        );
      }
      return true;
    });
  }, [userItems, roleTab, searchTerm]);

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 65,
      render: (id) => <span className="font-mono text-xs font-bold text-slate-400">#{id}</span>,
    },
    {
      title: "Foydalanuvchi",
      key: "user",
      width: 240,
      render: (_, record) => {
        const username = record.username || "Ismsiz";
        return (
          <div className="flex items-center gap-3 py-1">
            <Avatar
              size={40}
              className={`${
                record.role === UserRole.SUPER_ADMIN
                  ? "bg-gradient-to-tr from-amber-500 to-orange-500 ring-2 ring-amber-300 text-white"
                  : record.role === UserRole.ADMIN
                  ? "bg-gradient-to-tr from-purple-600 to-indigo-600 ring-2 ring-purple-200 text-white"
                  : "bg-indigo-100 text-indigo-700"
              } font-black text-sm flex-shrink-0 shadow-xs`}
            >
              {username[0]?.toUpperCase()}
            </Avatar>
            <div className="flex flex-col min-w-0">
              <div
                className="font-extrabold text-slate-900 text-sm hover:text-indigo-600 cursor-pointer truncate transition-colors flex items-center gap-1.5"
                onClick={() => navigate(`/users/${record.id}`)}
              >
                <span>{username}</span>
                {record.role === UserRole.SUPER_ADMIN && (
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-md bg-amber-100 text-amber-800 font-extrabold text-[9px] border border-amber-300">
                    <ShieldAlert className="w-2.5 h-2.5 text-amber-700" /> SUPER ADMIN
                  </span>
                )}
                {record.role === UserRole.ADMIN && (
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-md bg-purple-100 text-purple-700 font-extrabold text-[9px]">
                    <Shield className="w-2.5 h-2.5" /> ADMIN
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-400 font-mono mt-0.5 flex items-center gap-1">
                <Phone className="w-3 h-3 text-slate-400" />
                <span>{record.phone || "Telefon yo'q"}</span>
              </div>
            </div>
          </div>
        );
      },
    },
    {
      title: "Balans (Hisob)",
      dataIndex: "balance",
      key: "balance",
      width: 160,
      render: (balance) => (
        <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 font-black text-xs">
          <Wallet className="w-3.5 h-3.5 text-emerald-600" />
          <span>{Number(balance || 0).toLocaleString("uz-UZ")} UZS</span>
        </div>
      ),
    },
    {
      title: "Tizimdagi Roli",
      dataIndex: "role",
      key: "role",
      width: 170,
      render: (role, record) => {
        const isTargetSuperAdmin = record.role === UserRole.SUPER_ADMIN;
        const canManageTarget =
          currentAdminRole === UserRole.SUPER_ADMIN ||
          (!isTargetSuperAdmin && currentAdminRole === UserRole.ADMIN);
        const isLoading = updatingRoleId === record.id;

        return (
          <Select
            value={role || UserRole.USER}
            loading={isLoading}
            disabled={isLoading || !canManageTarget}
            onChange={(newRole) => updateUserRole({ id: record.id, newRole })}
            className="w-36 !rounded-xl"
            dropdownMatchSelectWidth={false}
          >
            <Option value={UserRole.USER}>
              <span className="font-semibold text-xs text-slate-700">USER</span>
            </Option>
            <Option value={UserRole.ADMIN}>
              <span className="font-bold text-xs text-purple-700">ADMIN</span>
            </Option>
            <Option
              value={UserRole.SUPER_ADMIN}
              disabled={currentAdminRole !== UserRole.SUPER_ADMIN}
            >
              <span className="font-bold text-xs text-amber-600">
                SUPER ADMIN
              </span>
            </Option>
            <Option value={UserRole.MODERATOR}>
              <span className="font-semibold text-xs text-blue-600">MODERATOR</span>
            </Option>
            <Option value={UserRole.SUPPORT}>
              <span className="font-semibold text-xs text-teal-600">SUPPORT</span>
            </Option>
          </Select>
        );
      },
    },
    {
      title: "E'lonlar",
      key: "productsCount",
      width: 105,
      render: (_, record) => {
        const count = record.productsCount || 0;
        return (
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-extrabold ${
              count > 0
                ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                : "text-slate-400 bg-slate-50 border border-slate-100"
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>{count} ta</span>
          </span>
        );
      },
    },
    {
      title: "Do'konlar",
      key: "shopsCount",
      width: 105,
      render: (_, record) => {
        const count = record.shopsCount || 0;
        return (
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-extrabold ${
              count > 0
                ? "bg-purple-50 text-purple-700 border border-purple-200"
                : "text-slate-400 bg-slate-50 border border-slate-100"
            }`}
          >
            <Store className="w-3.5 h-3.5" />
            <span>{count} ta</span>
          </span>
        );
      },
    },
    {
      title: "Telegram",
      key: "telegram",
      width: 160,
      render: (_, record) => {
        const hasBot = Boolean(record.hasTelegramBot || record.telegram_chat_id);
        const hasChannel = Boolean(record.hasTelegramChannel || record.telegram_channel_id);
        return (
          <div className="flex flex-col gap-1 text-[11px]">
            <Tooltip
              title={
                hasBot
                  ? `Bot ulangan: Chat ID #${record.telegram_chat_id}`
                  : "Botga ulanmagan"
              }
            >
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold text-[10px] ${
                  hasBot
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "text-slate-400 bg-slate-50"
                }`}
              >
                <span>🤖 {hasBot ? "Bot: Ulangan" : "Bot: Yo'q"}</span>
              </span>
            </Tooltip>
            <Tooltip
              title={
                hasChannel
                  ? `Guruh/Kanal: ${record.telegram_channel_id}`
                  : "Guruh yoki kanal qo'shilmagan"
              }
            >
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold text-[10px] truncate max-w-[140px] ${
                  hasChannel
                    ? "bg-sky-50 text-sky-700 border border-sky-200"
                    : "text-slate-400 bg-slate-50"
                }`}
              >
                <span>📢 {hasChannel ? record.telegram_channel_id : "Kanal: Yo'q"}</span>
              </span>
            </Tooltip>
          </div>
        );
      },
    },
    {
      title: "Holat & Xavfsizlik",
      key: "status",
      width: 170,
      render: (_, record) => {
        if (record.isBlocked) {
          return (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
              <Ban className="w-3.5 h-3.5 text-rose-600" />
              <span>Bloklangan</span>
            </span>
          );
        }
        if (record.isSpam) {
          return (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              <span>Spam Belgisi</span>
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Faol (Active)</span>
          </span>
        );
      },
    },
    {
      title: "Ro'yxatdan O'tgan",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 150,
      render: (date) => (
        <div className="text-xs text-slate-500 font-mono flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span>{date ? dayjs(date).format("YYYY-MM-DD") : "—"}</span>
        </div>
      ),
    },
    {
      title: "Amallar",
      key: "actions",
      width: 165,
      fixed: "right",
      render: (_, record) => (
        <div className="flex items-center gap-1">
          {(currentAdminRole === UserRole.SUPER_ADMIN || currentAdminRole === UserRole.ADMIN) && (
            <Tooltip title="Login, Parol va Rolni boshqarish">
              <button
                type="button"
                aria-label="Hisobni sozlash"
                onClick={() => openEditCredsModal(record)}
                className="btn-action-neutral hover:!text-amber-700 hover:!bg-amber-50"
              >
                <Key className="w-3.5 h-3.5" />
              </button>
            </Tooltip>
          )}

          <Tooltip title="Foydalanuvchiga xabar (Push) yuborish">
            <button
              type="button"
              aria-label="Push xabarnoma"
              onClick={() => openMessageModal(record)}
              className="btn-action-primary"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </Tooltip>

          <Tooltip title="Intizomiy chora (Bloklash / Spam)">
            <button
              type="button"
              aria-label="Moderatsiya chorasi"
              onClick={() => openModerationModal(record)}
              className={record.isBlocked || record.isSpam ? "btn-action-danger !bg-rose-600 !text-white" : "btn-action-neutral hover:!text-amber-700 hover:!bg-amber-50"}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
            </button>
          </Tooltip>

          <Tooltip title="360° CRM Profilini ochish">
            <button
              type="button"
              aria-label="Profilni ko'rish"
              onClick={() => navigate(`/users/${record.id}`)}
              className="btn-action-neutral hover:!text-blue-700 hover:!bg-blue-50"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
          </Tooltip>

          <Popconfirm
            title="Foydalanuvchini o'chirish"
            description={`Haqiqatan ham #${record.id} foydalanuvchini o'chirmoqchimisiz?`}
            onConfirm={() => deleteUser(record.id)}
            okText="Ha, o'chirish"
            cancelText="Bekor"
            okButtonProps={{ danger: true, size: "small" }}
            cancelButtonProps={{ size: "small" }}
          >
            <Tooltip title="O'chirish">
              <button
                type="button"
                aria-label="Foydalanuvchini o'chirish"
                className="btn-action-danger"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </Tooltip>
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Top Header Card */}
      <div className="enterprise-card p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-slate-900 m-0">
              Foydalanuvchilar & CRM Boshqaruv Markazi
            </h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
              CRM REGISTRY
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Barcha ro'yxatdan o'tgan mijozlar, hisob balansi, rollar va xavfsizlik moderatsiyasi
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Ism, telefon yoki ID..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20 w-64"
            />
          </div>

          {(currentAdminRole === UserRole.SUPER_ADMIN || currentAdminRole === UserRole.ADMIN) && (
            <Button
              type="primary"
              icon={<UserPlus className="w-4 h-4" />}
              onClick={() => setCreateAdminModalVisible(true)}
              className="!bg-indigo-600 hover:!bg-indigo-700 !rounded-lg !h-[34px] !px-3.5 !text-xs !font-bold flex items-center gap-1.5 shadow-xs"
            >
              + Yangi Admin Qo'shish
            </Button>
          )}
        </div>
      </div>

      {/* KPI Cards Bar */}
      <Row gutter={[12, 12]}>
        <Col xs={24} sm={12} lg={6}>
          <CompactStatCard
            title="Jami Mijozlar"
            value={stats.total.toLocaleString()}
            unit="mijoz"
            subtext="Ro'yxatdan o'tgan barcha hisoblar"
            icon={UsersIcon}
            color="blue"
          />
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <CompactStatCard
            title="Admin & Xodimlar"
            value={stats.admins.toLocaleString()}
            unit="staff"
            subtext="Boshqaruv vakolatiga egalar"
            icon={ShieldCheck}
            color="indigo"
          />
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <CompactStatCard
            title="Faol Mijozlar"
            value={stats.active.toLocaleString()}
            unit="faol"
            subtext="Cheklovlarsiz hisoblar"
            icon={CheckCircle2}
            color="emerald"
          />
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <CompactStatCard
            title="Bloklangan / Spam"
            value={(stats.blocked + stats.spam).toLocaleString()}
            unit="cheklovda"
            subtext="Moderatsiya jazo choralari"
            icon={Ban}
            color={stats.blocked + stats.spam > 0 ? "rose" : "slate"}
          />
        </Col>
      </Row>

      {/* Main Table with Tabs */}
      <div className="enterprise-card p-4">
        <div className="border-b border-slate-100 pb-2 mb-4">
          <Tabs
            activeKey={roleTab}
            onChange={(k) => {
              setRoleTab(k);
              setPage(1);
            }}
            className="!m-0"
            items={[
              { key: "all", label: `Barchasi (${totalUsers})` },
              { key: "active", label: `Faol (${stats.active})` },
              { key: "user", label: "Oddiy Foydalanuvchilar" },
              { key: "admin", label: `Adminlar (${stats.admins})` },
              { key: "bot", label: "🤖 Botga ulanganlar" },
              { key: "channel", label: "📢 Guruh/Kanal ulaganlar" },
              { key: "blocked", label: `Bloklanganlar (${stats.blocked})` },
              { key: "spam", label: `Spam Belgisi (${stats.spam})` },
            ]}
          />
        </div>

        <Table
          dataSource={userItems}
          columnDefs={columns}
          isLoading={isLoading}
          page={currentPage}
          pageSize={pageSize}
          total={totalUsers}
          setPage={setPage}
          setPageSize={setPageSize}
        />
      </div>

      {/* Direct Message Modal */}
      <Modal
        title={
          <span className="font-bold text-sm text-slate-900">
            Foydalanuvchiga Push Xabar Yuborish ({selectedUser?.username})
          </span>
        }
        open={messageModalVisible}
        onCancel={() => setMessageModalVisible(false)}
        onOk={() => {
          if (!msgBody.trim()) {
            message.warning("Xabar matnini kiriting!");
            return;
          }
          directMessageMutation.mutate({
            userId: selectedUser.id,
            title: msgTitle,
            message: msgBody,
          });
        }}
        confirmLoading={directMessageMutation.isPending}
        okText="Xabarni Yuborish"
        cancelText="Bekor"
        centered
      >
        <div className="space-y-4 pt-2">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Xabar Sarlavhasi:</label>
            <Input
              value={msgTitle}
              onChange={(e) => setMsgTitle(e.target.value)}
              className="text-xs"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Xabar Matni:</label>
            <TextArea
              rows={4}
              value={msgBody}
              onChange={(e) => setMsgBody(e.target.value)}
              placeholder="Foydalanuvchiga yuboriladigan to'liq matn..."
              className="text-xs"
            />
          </div>
        </div>
      </Modal>

      {/* User Moderation Modal */}
      <Modal
        title={
          <span className="font-bold text-sm text-slate-900">
            Intizomiy Moderatsiya Boshqaruvi ({selectedUser?.username})
          </span>
        }
        open={moderationModalVisible}
        onCancel={() => setModerationModalVisible(false)}
        onOk={handleModerationSubmit}
        confirmLoading={userModerationMutation.isPending}
        okText="O'zgarishlarni Saqlash"
        cancelText="Bekor"
        okButtonProps={{ danger: true }}
        width={540}
        centered
      >
        <div className="space-y-4 pt-2">
          {/* Block Section */}
          <div className="p-3.5 rounded-lg bg-rose-50/70 border border-rose-200">
            <div className="flex justify-between items-center mb-1">
              <span className="font-semibold text-xs text-rose-900 flex items-center gap-1.5">
                <Ban className="w-4 h-4 text-rose-600" />
                Foydalanuvchini Bloklash (Ban)
              </span>
              <Switch checked={modIsBlocked} onChange={setModIsBlocked} />
            </div>

            {modIsBlocked && (
              <div className="space-y-2.5 mt-3 pt-2.5 border-t border-rose-200/80">
                <div>
                  <label className="text-[11px] font-semibold text-rose-900 block mb-1">Bloklash Muddati:</label>
                  <Radio.Group value={modBlockDuration} onChange={(e) => setModBlockDuration(e.target.value)} size="small">
                    <Radio.Button value="24h">24 soat</Radio.Button>
                    <Radio.Button value="3d">3 kun</Radio.Button>
                    <Radio.Button value="7d">7 kun</Radio.Button>
                    <Radio.Button value="30d">30 kun</Radio.Button>
                  </Radio.Group>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-rose-900 block mb-1">Bloklash Sababi:</label>
                  <Input
                    placeholder="Qoidabuzarlik sababini yozing..."
                    value={modBanReason}
                    onChange={(e) => setModBanReason(e.target.value)}
                    className="bg-white text-xs"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Spam Section */}
          <div className="p-3.5 rounded-lg bg-amber-50/70 border border-amber-200">
            <div className="flex justify-between items-center mb-1">
              <span className="font-semibold text-xs text-amber-900 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                Spam Belgisi (Cheklov)
              </span>
              <Switch checked={modIsSpam} onChange={setModIsSpam} />
            </div>

            {modIsSpam && (
              <div className="space-y-2.5 mt-3 pt-2.5 border-t border-amber-200/80">
                <div>
                  <label className="text-[11px] font-semibold text-amber-900 block mb-1">Spam Muddati:</label>
                  <Radio.Group value={modSpamDuration} onChange={(e) => setModSpamDuration(e.target.value)} size="small">
                    <Radio.Button value="24h">24 soat</Radio.Button>
                    <Radio.Button value="7d">7 kun</Radio.Button>
                  </Radio.Group>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-amber-900 block mb-1">Spam Sababi:</label>
                  <Input
                    placeholder="Spam tarqatish sababi..."
                    value={modSpamReason}
                    onChange={(e) => setModSpamReason(e.target.value)}
                    className="bg-white text-xs"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Send notification */}
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex justify-between items-center">
            <span className="text-xs font-medium text-slate-700">Foydalanuvchiga Push Bildirishnoma Yuborilsinmi?</span>
            <Switch checked={modSendNotification} onChange={setModSendNotification} />
          </div>
        </div>
      </Modal>

      {/* Create New Admin Modal */}
      <CreateAdminModal
        visible={createAdminModalVisible}
        onClose={() => setCreateAdminModalVisible(false)}
        onSuccess={() => refetch()}
        currentAdminRole={currentAdminRole}
      />

      {/* Edit Admin & User Credentials Modal */}
      <AdminCredentialsModal
        visible={editCredsModalVisible}
        onClose={() => {
          setEditCredsModalVisible(false);
          setUserForCreds(null);
        }}
        onSuccess={() => refetch()}
        user={userForCreds}
        currentAdminRole={currentAdminRole}
      />
    </div>
  );
};

export default Users;
