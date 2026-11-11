import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "./../config/auth/api";
import { get } from "lodash";
import {
  message,
  Card,
  Row,
  Col,
  Avatar,
  Tag,
  Button,
  Spin,
  Modal,
  Input,
  Radio,
  Switch,
  Space,
  Tabs,
  Descriptions,
  Table,
} from "antd";
import {
  ArrowLeftOutlined,
  UserOutlined,
  SendOutlined,
  StopOutlined,
  PhoneOutlined,
  ShoppingOutlined,
  CreditCardOutlined,
  AlertOutlined,
  HistoryOutlined,
  ShopOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  LinkOutlined,
  MessageOutlined,
  GlobalOutlined,
  AppstoreOutlined,
  KeyOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import ProductReference from "../components/ProductReference";
import UserReference from "../components/UserReference";
import StatusBadge from "../components/StatusBadge";
import AdminCredentialsModal from "../components/AdminCredentialsModal";

const UserDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Admin me query
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

  // Credentials modal state
  const [editCredsModalOpen, setEditCredsModalOpen] = useState(false);

  // Message modal state
  const [msgModalOpen, setMsgModalOpen] = useState(false);
  const [directMsgTitle, setDirectMsgTitle] = useState("Kelishamiz.uz Xabarnomasi");
  const [directMsgBody, setDirectMsgBody] = useState("");

  // Moderation modal state
  const [modModalOpen, setModModalOpen] = useState(false);
  const [modIsBlocked, setModIsBlocked] = useState(false);
  const [modBlockDuration, setModBlockDuration] = useState("24h");
  const [modBanReason, setModBanReason] = useState("");
  const [modIsSpam, setModIsSpam] = useState(false);
  const [modSpamDuration, setModSpamDuration] = useState("24h");
  const [modSpamReason, setModSpamReason] = useState("");
  const [modSendNotif, setModSendNotif] = useState(true);
  const [modNotifText, setModNotifText] = useState("Hisobingiz bo‘yicha moderatsiya cheklovi o‘rnatildi.");


  const { data, isLoading, refetch } = useQuery({
    queryKey: ["user_details_360", id],
    queryFn: async () => {
      try {
        const response = await api.get(`/admin/users/${id}/360`);
        if (response.status === 200 && response.data) {
          return response.data;
        }
      } catch (err) {
        try {
          const fallback = await api.get(`/users/${id}/details`);
          return fallback.data;
        } catch {
          const fallbackAdmin = await api.get(`/admin/users/${id}`);
          return fallbackAdmin.data;
        }
      }
    },
  });

  const sendMsgMutation = useMutation({
    mutationFn: async ({ userId, title, message: text }) => {
      const res = await api.post(`/admin/users/${userId}/notify`, {
        title,
        message: text,
      });
      return res.data;
    },
    onSuccess: () => {
      message.success("Xabarnoma muvaffaqiyatli yuborildi!");
      setMsgModalOpen(false);
      setDirectMsgBody("");
    },
    onError: () => {
      message.error("Xabarnomani yuborishda xatolik yuz berdi");
    },
  });

  const moderationMutation = useMutation({
    mutationFn: async ({ userId, payload }) => {
      const res = await api.patch(`/admin/users/${userId}/moderation`, payload);
      return res.data;
    },
    onSuccess: () => {
      message.success("Foydalanuvchi moderatsiya holati yangilandi!");
      setModModalOpen(false);
      refetch();
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: () => {
      message.error("Foydalanuvchi holatini yangilashda xatolik yuz berdi");
    },
  });

  const user =
    get(data, "content.user") ||
    get(data, "user") ||
    (get(data, "content.id") ? get(data, "content") : null) ||
    (data?.id ? data : null);
  const stats = get(data, "content.stats", get(data, "stats", {}));
  const shops = get(data, "content.shops", get(data, "shops", []));
  const telegram = get(data, "content.telegram", get(data, "telegram", {}));
  const products = get(data, "content.products", get(data, "products", []));
  const transactions = get(data, "content.transactions", get(data, "transactions", []));
  const reportsFiled = get(data, "content.reportsFiled", get(data, "reportsFiled", get(data, "content.reports.filed", [])));
  const reportsAgainst = get(data, "content.reportsAgainst", get(data, "reportsAgainst", get(data, "content.reports.against", [])));
  const auditHistory = get(data, "content.moderationHistory", get(data, "moderationHistory", get(data, "content.auditHistory", [])));

  const allReports = [
    ...(Array.isArray(reportsAgainst) ? reportsAgainst : []).map((r) => ({ ...r, direction: "AGAINST" })),
    ...(Array.isArray(reportsFiled) ? reportsFiled : []).map((r) => ({ ...r, direction: "FILED" })),
  ];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Spin size="large" tip="Foydalanuvchi ma'lumotlari yuklanmoqda..." />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-100 shadow-sm">
        <h3 className="text-lg font-bold text-slate-800 mb-4">Foydalanuvchi topilmadi</h3>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate("/users")}>
          Foydalanuvchilar ro'yxatiga qaytish
        </Button>
      </div>
    );
  }

  const productColumns = [
    {
      title: "E'lon Ma'lumoti",
      key: "product",
      render: (_, record) => (
        <ProductReference
          product={record}
          id={record.id}
          size="sm"
        />
      ),
    },
    {
      title: "Kategoriya",
      dataIndex: ["category", "name"],
      key: "category",
      render: (cat) => <Tag color="purple">{cat || "N/A"}</Tag>,
    },
    {
      title: "E'lon Turi",
      dataIndex: "dealType",
      key: "dealType",
      render: (dealType) => {
        const type = (dealType || "SELL").toUpperCase();
        const map = {
          SELL: { label: "Sotish", color: "green", icon: "🏷️" },
          RENT_OUT: { label: "Ijara (Berish)", color: "blue", icon: "🔑" },
          DAILY_RENT: { label: "Kunlik ijara", color: "cyan", icon: "📅" },
          BUY: { label: "Sotib olish", color: "orange", icon: "🛒" },
          RENT_IN: { label: "Ijara (Olish)", color: "purple", icon: "🏠" },
          INSTALLMENT: { label: "Bo'lib to'lash", color: "geekblue", icon: "💳" },
          VIPKUP: { label: "Vipkup", color: "teal", icon: "🤝" },
          EXCHANGE: { label: "Barter", color: "magenta", icon: "🔄" },
        };
        const item = map[type] || { label: type.replace(/_/g, " "), color: "default", icon: "📌" };
        return <Tag color={item.color}>{item.icon} {item.label}</Tag>;
      },
    },
    {
      title: "Narx",
      dataIndex: "price",
      key: "price",
      render: (price, record) => (
        <span className="font-extrabold text-slate-900">
          {Number(price || 0).toLocaleString("uz-UZ")} {record.currencyType || "UZS"}
        </span>
      ),
    },
    {
      title: "Holati",
      dataIndex: "status",
      key: "status",
      render: (st, record) => (
        <StatusBadge status={st || (record.published ? "active" : "pending")} domain="listing" />
      ),
    },
  ];

  const shopColumns = [
    {
      title: "Do'kon",
      key: "shop",
      render: (_, r) => (
        <div className="flex items-center gap-2.5 py-1">
          <Avatar
            size={40}
            src={r.logoUrl}
            icon={<ShopOutlined />}
            className="bg-purple-100 text-purple-700 font-bold border border-purple-200 flex-shrink-0"
          >
            {(r.name || "D")[0]?.toUpperCase()}
          </Avatar>
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-slate-900 text-xs truncate">{r.name}</span>
            <span className="text-[11px] font-mono text-purple-600">@{r.username}</span>
          </div>
        </div>
      ),
    },
    {
      title: "Kategoriya",
      dataIndex: "categoryName",
      key: "categoryName",
      render: (cat) => <Tag color="purple">{cat || "Umumiy"}</Tag>,
    },
    {
      title: "Mahsulotlar Soni",
      key: "productsCount",
      render: (_, r) => (
        <div className="flex flex-col text-xs">
          <span className="font-extrabold text-slate-800">{r.productsCount || 0} ta mahsulot</span>
          <span className="text-[10px] text-emerald-600 font-medium">({r.activeProductsCount || 0} ta faol)</span>
        </div>
      ),
    },
    {
      title: "Telefon",
      dataIndex: "phone",
      key: "phone",
      render: (ph) => <span className="font-mono text-xs text-slate-600">{ph || "—"}</span>,
    },
    {
      title: "Holati",
      key: "status",
      render: (_, r) => (
        <Space size={4}>
          <Tag color={r.status === "ACTIVE" ? "success" : "default"}>
            {r.status === "ACTIVE" ? "FAOL" : r.status}
          </Tag>
          {r.isVerified && <Tag color="blue">TASDIQLANGAN</Tag>}
        </Space>
      ),
    },
    {
      title: "Havola",
      key: "link",
      render: (_, r) => {
        const url = `https://kelishamiz.uz/shop/${r.username || r.id}`;
        return (
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="text-indigo-600 hover:text-indigo-800 font-semibold text-xs inline-flex items-center gap-1"
          >
            Saytda ko'rish <ArrowLeftOutlined className="rotate-135 text-[10px]" />
          </a>
        );
      },
    },
  ];

  const transactionColumns = [
    {
      title: "Tranzaksiya ID",
      dataIndex: "paymeTransactionId",
      key: "paymeTransactionId",
      render: (text) => <span className="font-mono text-xs font-bold text-slate-600">#{text}</span>,
    },
    {
      title: "Summa",
      dataIndex: "amount",
      key: "amount",
      render: (amount) => {
        const sum = Number(amount || 0) / 100;
        return <span className="font-extrabold text-emerald-600">{sum.toLocaleString("uz-UZ")} UZS</span>;
      },
    },
    {
      title: "Sana",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (text) => dayjs(text).format("YYYY-MM-DD HH:mm"),
    },
    {
      title: "Holati",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        if (status === "success") return <Tag color="success">MUVAFFAQIYATLI</Tag>;
        if (status === "pending") return <Tag color="warning">KUTILMOQDA</Tag>;
        return <Tag color="error">{status?.toUpperCase()}</Tag>;
      },
    },
  ];

  const reportColumns = [
    {
      title: "Yo'nalish",
      dataIndex: "direction",
      key: "direction",
      width: 140,
      render: (dir) => (
        <Tag color={dir === "AGAINST" ? "error" : "blue"} className="font-bold text-[11px]">
          {dir === "AGAINST" ? "Mijoz ustidan" : "Mijoz yozgan"}
        </Tag>
      ),
    },
    {
      title: "Sabab / Izoh",
      dataIndex: "reason",
      key: "reason",
      render: (text) => (
        <span className="font-bold text-xs text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
          {text || "Sabab ko'rsatilmagan"}
        </span>
      ),
    },
    {
      title: "Holati",
      dataIndex: "status",
      key: "status",
      width: 130,
      render: (st) => <StatusBadge status={st} domain="report" />,
    },
    {
      title: "Sana",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 130,
      render: (d) => <span className="font-mono text-xs text-slate-500">{d ? dayjs(d).format("YYYY-MM-DD HH:mm") : "—"}</span>,
    },
  ];

  const auditColumns = [
    {
      title: "Amal",
      dataIndex: "action",
      key: "action",
      width: 170,
      render: (action) => (
        <span className="font-mono font-semibold text-xs text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
          {action}
        </span>
      ),
    },
    {
      title: "Admin Mas'ul",
      key: "admin",
      width: 170,
      render: (_, r) => (
        <UserReference
          user={r.admin}
          id={r.adminId}
          fallbackName={`Admin #${r.adminId || 1}`}
          showPhone={false}
          size="sm"
        />
      ),
    },
    {
      title: "Tafsilot",
      dataIndex: "details",
      key: "details",
      render: (det) => {
        const text = det?.reason || (typeof det === "string" ? det : JSON.stringify(det || {}));
        return <span className="text-xs text-slate-600 line-clamp-2">{text || "—"}</span>;
      },
    },
    {
      title: "Vaqt",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 140,
      render: (d) => <span className="font-mono text-xs text-slate-500">{d ? dayjs(d).format("YYYY-MM-DD HH:mm") : "—"}</span>,
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* Top Header */}
      <div className="enterprise-card p-3.5 flex items-center justify-between">
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate("/users")}
          size="small"
          className="!rounded-md font-semibold text-xs"
        >
          Foydalanuvchilar Ro'yxatiga Qaytish
        </Button>
        <div className="flex items-center gap-2">
          <Tag color="blue" className="!rounded px-2 py-0.5 font-semibold text-xs m-0">
            360° PROFIL #{user.id}
          </Tag>
          <Tag
            color={
              user.role === "SUPER_ADMIN"
                ? "gold"
                : user.role === "ADMIN"
                ? "purple"
                : "geekblue"
            }
            className="!rounded px-2 py-0.5 font-bold text-xs m-0"
          >
            {user.role}
          </Tag>
        </div>
      </div>

      <Row gutter={[12, 12]}>
        {/* Left Profile Card */}
        <Col xs={24} lg={8}>
          <div className="enterprise-card p-4 flex flex-col gap-4">
            <div className="flex flex-col items-center text-center pb-3 border-b border-slate-100">
              <Avatar
                size={64}
                src={get(user, "profile.avatar")}
                icon={<UserOutlined />}
                className="bg-blue-700 text-white font-bold text-xl border-2 border-white shadow-xs"
              >
                {(user.username || "U")[0]?.toUpperCase()}
              </Avatar>
              <h2 className="text-base font-bold text-slate-900 mt-2.5 m-0">
                {get(user, "profile.fullName") || user.username || "Ismsiz"}
              </h2>
              <div className="text-xs text-slate-500 font-mono mt-0.5 flex items-center gap-1">
                <PhoneOutlined /> {user.phone || "Telefon yo'q"}
              </div>
              <div className="mt-2.5 flex gap-1.5 flex-wrap justify-center">
                {user.isBlocked ? (
                  <Tag color="error" className="!rounded px-2 py-0.5 font-semibold text-[11px] m-0">
                    Bloklangan
                  </Tag>
                ) : (
                  <Tag color="success" className="!rounded px-2 py-0.5 font-semibold text-[11px] m-0">
                    Faol Akkaunt
                  </Tag>
                )}
                {user.isSpam && (
                  <Tag color="warning" className="!rounded px-2 py-0.5 font-semibold text-[11px] m-0">
                    Spam Belgisi
                  </Tag>
                )}
              </div>
            </div>

            {/* User Meta Data */}
            <div className="flex flex-col gap-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100 items-center">
                <span className="text-slate-500 font-medium">Hamyon Balansi:</span>
                <span className="font-bold text-emerald-700 text-sm">
                  {Number(user.balance || 0).toLocaleString("uz-UZ")} UZS
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 items-center">
                <span className="text-slate-500 font-medium">Username:</span>
                <span className="font-semibold text-slate-800">@{user.username || "yo'q"}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 items-center">
                <span className="text-slate-500 font-medium">Telegram Bot:</span>
                {telegram.isBotConnected || user.profile?.telegram_chat_id ? (
                  <Tag color="success" className="!rounded m-0 font-bold text-[11px]">
                    Ulangan (#{telegram.chatId || user.profile?.telegram_chat_id})
                  </Tag>
                ) : (
                  <Tag color="default" className="!rounded m-0 text-[11px] text-slate-400">
                    Ulanmagan
                  </Tag>
                )}
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 items-center">
                <span className="text-slate-500 font-medium">Telegram Guruh/Kanal:</span>
                {telegram.isChannelConnected || user.profile?.telegram_channel_id || user.telegram_channel_id ? (
                  <Tag color="blue" className="!rounded m-0 font-bold text-[11px] max-w-[150px] truncate">
                    {telegram.channelId || user.profile?.telegram_channel_id || user.telegram_channel_id}
                  </Tag>
                ) : (
                  <Tag color="default" className="!rounded m-0 text-[11px] text-slate-400">
                    Ulanmagan
                  </Tag>
                )}
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 items-center">
                <span className="text-slate-500 font-medium">Do'konlar Soni:</span>
                <span className="font-bold text-slate-800">
                  {stats.shopsCount ?? shops.length} ta ({stats.totalShopProducts ?? 0} tovar)
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 items-center">
                <span className="text-slate-500 font-medium">Jami E'lonlar:</span>
                <span className="font-bold text-slate-800">
                  {stats.totalListings ?? products.length} ta ({stats.activeListings ?? 0} faol)
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 items-center">
                <span className="text-slate-500 font-medium">Hudud:</span>
                <span className="font-semibold text-slate-800 text-right truncate max-w-[180px]">
                  {get(user, "profile.region.name", "N/A")} / {get(user, "profile.district.name", "N/A")}
                </span>
              </div>
              <div className="flex justify-between py-1 items-center">
                <span className="text-slate-500 font-medium">Manzil:</span>
                <span className="font-semibold text-slate-800 text-right truncate max-w-[180px]">{get(user, "profile.address") || "Kiritilmagan"}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
              <Button
                icon={<KeyOutlined />}
                onClick={() => setEditCredsModalOpen(true)}
                className="!rounded-lg font-semibold h-9 !text-amber-700 !border-amber-200 hover:!bg-amber-50 text-xs flex items-center justify-center gap-1.5"
              >
                Login / Parol / Rolni O'zgartirish
              </Button>
              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={() => setMsgModalOpen(true)}
                className="!rounded-lg font-semibold h-9 !bg-blue-700 hover:!bg-blue-800 text-xs"
              >
                Xabarnoma Yuborish
              </Button>
              <Button
                danger
                icon={<StopOutlined />}
                onClick={() => {
                  setModIsBlocked(Boolean(user.isBlocked));
                  setModBanReason(user.banReason || "");
                  setModIsSpam(Boolean(user.isSpam));
                  setModSpamReason(user.spamReason || "");
                  setModModalOpen(true);
                }}
                className="!rounded-lg font-semibold h-9 text-xs"
              >
                Intizomiy Boshqaruv (Ban / Spam)
              </Button>
            </div>
          </div>
        </Col>

        {/* Right Content 360° Tabs */}
        <Col xs={24} lg={16}>
          <div className="enterprise-card p-4">
            <Tabs
              defaultActiveKey="1"
              items={[
                {
                  key: "1",
                  label: (
                    <span className="font-semibold text-xs flex items-center gap-1.5">
                      <ShoppingOutlined /> E'lonlar ({products.length})
                    </span>
                  ),
                  children: (
                    <Table
                      size="small"
                      dataSource={products}
                      columns={productColumns}
                      rowKey="id"
                      scroll={{ x: 600 }}
                      pagination={{
                        pageSize: 5,
                        size: "small",
                        showTotal: (total) => `Jami: ${total} ta e'lon`,
                      }}
                    />
                  ),
                },
                {
                  key: "shops",
                  label: (
                    <span className="font-semibold text-xs flex items-center gap-1.5">
                      <ShopOutlined /> Do'konlar ({shops.length})
                    </span>
                  ),
                  children: (
                    <Table
                      size="small"
                      dataSource={shops}
                      columns={shopColumns}
                      rowKey="id"
                      scroll={{ x: 600 }}
                      pagination={{
                        pageSize: 5,
                        size: "small",
                        showTotal: (total) => `Jami: ${total} ta do'kon`,
                      }}
                    />
                  ),
                },
                {
                  key: "2",
                  label: (
                    <span className="font-semibold text-xs flex items-center gap-1.5">
                      <AlertOutlined /> Shikoyatlar ({allReports.length})
                    </span>
                  ),
                  children: (
                    <Table
                      size="small"
                      dataSource={allReports}
                      columns={reportColumns}
                      rowKey={(r, i) => r.id || i}
                      scroll={{ x: 500 }}
                      pagination={{
                        pageSize: 5,
                        size: "small",
                        showTotal: (total) => `Jami: ${total} ta shikoyat`,
                      }}
                    />
                  ),
                },
                {
                  key: "3",
                  label: (
                    <span className="font-semibold text-xs flex items-center gap-1.5">
                      <HistoryOutlined /> Moderatsiya Tarixi ({auditHistory.length})
                    </span>
                  ),
                  children: (
                    <Table
                      size="small"
                      dataSource={auditHistory}
                      columns={auditColumns}
                      rowKey={(r, i) => r.id || i}
                      scroll={{ x: 500 }}
                      pagination={{
                        pageSize: 5,
                        size: "small",
                        showTotal: (total) => `Jami: ${total} ta ma'muriy amal`,
                      }}
                    />
                  ),
                },
                {
                  key: "4",
                  label: (
                    <span className="font-semibold text-xs flex items-center gap-1.5">
                      <CreditCardOutlined /> To'lovlar Tarixi ({transactions.length})
                    </span>
                  ),
                  children: (
                    <Table
                      size="small"
                      dataSource={transactions}
                      columns={transactionColumns}
                      rowKey="id"
                      scroll={{ x: 500 }}
                      pagination={{
                        pageSize: 5,
                        size: "small",
                        showTotal: (total) => `Jami: ${total} ta tranzaksiya`,
                      }}
                    />
                  ),
                },
              ]}
            />
          </div>
        </Col>
      </Row>

      {/* Message Modal */}
      <Modal
        title={`📩 Xabar: @${user.username || user.phone}`}
        open={msgModalOpen}
        onCancel={() => setMsgModalOpen(false)}
        onOk={() => {
          if (!directMsgBody.trim()) {
            message.warning("Xabar matnini kiriting!");
            return;
          }
          sendMsgMutation.mutate({
            userId: user.id,
            title: directMsgTitle,
            message: directMsgBody,
          });
        }}
        confirmLoading={sendMsgMutation.isPending}
        okText="Yuborish"
        cancelText="Bekor"
      >
        <div className="flex flex-col gap-3 mt-4">
          <Input value={directMsgTitle} onChange={(e) => setDirectMsgTitle(e.target.value)} placeholder="Sarlavha" />
          <Input.TextArea rows={4} value={directMsgBody} onChange={(e) => setDirectMsgBody(e.target.value)} placeholder="Xabar matni..." />
        </div>
      </Modal>

      {/* Moderation Modal */}
      <Modal
        title={`🛡️ Intizomiy Holat (@${user.username || user.phone})`}
        open={modModalOpen}
        onCancel={() => setModModalOpen(false)}
        onOk={() => {
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

          moderationMutation.mutate({
            userId: user.id,
            payload: {
              isBlocked: modIsBlocked,
              blockedUntil,
              banReason: modBanReason || (modIsBlocked ? "Qoidabuzarlik sababli" : null),
              isSpam: modIsSpam,
              spamUntil,
              spamReason: modSpamReason || (modIsSpam ? "Spam tarqatish" : null),
              sendNotification: modSendNotif,
              notificationMessage: modNotifText,
            },
          });
        }}
        confirmLoading={moderationMutation.isPending}
        okText="Saqlash"
        cancelText="Bekor"
      >
        <div className="flex flex-col gap-4 mt-4">
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200">
            <div className="flex justify-between items-center mb-2">
              <span className="font-bold text-rose-700">🚫 Foydalanuvchini Bloklash</span>
              <Switch checked={modIsBlocked} onChange={setModIsBlocked} />
            </div>
            {modIsBlocked && (
              <div className="flex flex-col gap-3 mt-3">
                <Radio.Group value={modBlockDuration} onChange={(e) => setModBlockDuration(e.target.value)}>
                  <Radio.Button value="24h">24s</Radio.Button>
                  <Radio.Button value="3d">3 kun</Radio.Button>
                  <Radio.Button value="7d">7 kun</Radio.Button>
                  <Radio.Button value="30d">30 kun</Radio.Button>
                  <Radio.Button value="permanent">Doimiy</Radio.Button>
                </Radio.Group>
                <Input placeholder="Bloklash sababi..." value={modBanReason} onChange={(e) => setModBanReason(e.target.value)} />
              </div>
            )}
          </div>

          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
            <div className="flex justify-between items-center mb-2">
              <span className="font-bold text-amber-700">⚠️ Spam Belgisi</span>
              <Switch checked={modIsSpam} onChange={setModIsSpam} />
            </div>
            {modIsSpam && (
              <div className="flex flex-col gap-3 mt-3">
                <Radio.Group value={modSpamDuration} onChange={(e) => setModSpamDuration(e.target.value)}>
                  <Radio.Button value="24h">24s</Radio.Button>
                  <Radio.Button value="7d">7 kun</Radio.Button>
                  <Radio.Button value="permanent">Doimiy</Radio.Button>
                </Radio.Group>
                <Input placeholder="Spam sababi..." value={modSpamReason} onChange={(e) => setModSpamReason(e.target.value)} />
              </div>
            )}
          </div>
        </div>
      </Modal>

      <AdminCredentialsModal
        visible={editCredsModalOpen}
        onClose={() => setEditCredsModalOpen(false)}
        onSuccess={() => {
          refetch();
          queryClient.invalidateQueries({ queryKey: ["users"] });
          queryClient.invalidateQueries({ queryKey: ["admin-users"] });
        }}
        user={user}
        currentAdminRole={currentAdminRole}
      />
    </div>
  );
};

export default UserDetail;
