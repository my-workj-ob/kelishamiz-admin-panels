import React, { useState, useEffect } from "react";
import { Modal, Input, Select, Button, message, Space, Alert, Tag } from "antd";
import { Key, Shield, Phone, User, RefreshCw, Lock } from "lucide-react";
import api from "../config/auth/api";

const { Option } = Select;

function generateStrongPassword() {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghijkmnpqrstuvwxyz";
  const digits = "23456789";
  const special = "!@#$%^&*";
  const all = upper + lower + digits + special;

  let pass = "";
  pass += upper[Math.floor(Math.random() * upper.length)];
  pass += lower[Math.floor(Math.random() * lower.length)];
  pass += digits[Math.floor(Math.random() * digits.length)];
  pass += special[Math.floor(Math.random() * special.length)];

  for (let i = 4; i < 12; i++) {
    pass += all[Math.floor(Math.random() * all.length)];
  }
  return pass.split("").sort(() => 0.5 - Math.random()).join("");
}

export default function AdminCredentialsModal({
  visible,
  onClose,
  onSuccess,
  user,
  currentAdminRole = "SUPER_ADMIN",
}) {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("USER");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isSuperAdmin = currentAdminRole === "SUPER_ADMIN";

  useEffect(() => {
    if (user && visible) {
      setFullName(user.profile?.fullName || user.fullName || "");
      setPhone(user.phone || "");
      setUsername(user.username || "");
      setPassword("");
      setRole(user.role || "USER");
    }
  }, [user, visible]);

  const handleGeneratePassword = () => {
    const generated = generateStrongPassword();
    setPassword(generated);
  };

  const handleSubmit = async () => {
    if (!user?.id) return;

    if (!username.trim()) {
      message.error("Foydalanuvchi nomi (username) bo'sh bo'lishi mumkin emas");
      return;
    }
    if (!phone.trim()) {
      message.error("Telefon raqami kiritilishi shart");
      return;
    }
    if (password && password.length < 6) {
      message.error("Yangi parol kamida 6 ta belgidan iborat bo'lishi kerak");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        fullName: fullName.trim() || undefined,
        phone: phone.trim(),
        username: username.trim(),
        role: role !== user.role ? role : undefined,
        password: password.trim() ? password.trim() : undefined,
      };

      const res = await api.patch(`/admin/users/${user.id}/credentials`, payload);
      message.success(res.data?.message || "Hisob ma'lumotlari muvaffaqiyatli yangilandi!");
      
      setPassword("");
      if (onSuccess) onSuccess();
      if (onClose) onClose();
    } catch (err) {
      const errMsg = err?.response?.data?.message || "Ma'lumotlarni yangilashda xatolik yuz berdi";
      message.error(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      footer={null}
      destroyOnClose
      width={480}
      title={
        <div className="flex items-center gap-2 text-slate-900 font-bold text-base pb-1">
          <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center">
            <Key className="w-4 h-4" />
          </div>
          <span>Hisob & Xavfsizlik Sozlamalari</span>
        </div>
      }
    >
      <div className="flex flex-col gap-4 py-2">
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <span>Foydalanuvchi #{user?.id}: @{user?.username}</span>
            </div>
            <div className="text-[11px] text-slate-500 font-mono mt-0.5">
              Joriy telefon: {user?.phone || "Yo'q"}
            </div>
          </div>
          <Tag color={user?.role === "SUPER_ADMIN" ? "gold" : user?.role === "ADMIN" ? "purple" : "blue"} className="font-bold text-xs m-0">
            {user?.role}
          </Tag>
        </div>

        {/* Full Name */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            To'liq ism (F.I.SH)
          </label>
          <Input
            prefix={<User className="w-4 h-4 text-slate-400 mr-1" />}
            placeholder="Falonchi Pistonchiyev"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="!rounded-lg text-xs py-2"
          />
        </div>

        {/* Phone */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Telefon raqami (Login) *
          </label>
          <Input
            prefix={<Phone className="w-4 h-4 text-slate-400 mr-1" />}
            placeholder="+998901234567"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="!rounded-lg text-xs py-2 font-mono"
          />
        </div>

        {/* Username */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Foydalanuvchi nomi (@username) *
          </label>
          <Input
            prefix={<span className="text-slate-400 font-bold text-xs mr-1">@</span>}
            placeholder="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="!rounded-lg text-xs py-2"
          />
        </div>

        {/* New Password */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-bold text-slate-700">
              Yangi parol (Ixtiyoriy)
            </label>
            <button
              type="button"
              onClick={handleGeneratePassword}
              className="text-[11px] text-amber-600 hover:text-amber-800 font-semibold inline-flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" /> Parol generatsiya
            </button>
          </div>
          <Input.Password
            prefix={<Lock className="w-4 h-4 text-slate-400 mr-1" />}
            placeholder="O'zgartirmaslik uchun bo'sh qoldiring"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="!rounded-lg text-xs py-2 font-mono"
          />
          <span className="text-[10px] text-slate-400 mt-1 block">
            Parol kiritilsa, eski parol bekor qilinadi va barcha boshqa faol sessiyalar qayta tiklanadi.
          </span>
        </div>

        {/* Role */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Tizimdagi roli
          </label>
          <Select
            value={role}
            onChange={setRole}
            className="w-full !rounded-lg"
            size="large"
          >
            <Option value="USER">
              <span className="font-semibold text-xs text-slate-700">USER (Oddiy foydalanuvchi)</span>
            </Option>
            <Option value="ADMIN">
              <span className="font-bold text-xs text-purple-700">ADMIN (Administrator)</span>
            </Option>
            <Option value="MODERATOR">
              <span className="font-bold text-xs text-blue-600">MODERATOR (Moderator)</span>
            </Option>
            <Option value="SUPPORT">
              <span className="font-bold text-xs text-teal-600">SUPPORT (Qo'llab-quvvatlash)</span>
            </Option>
            {isSuperAdmin && (
              <Option value="SUPER_ADMIN">
                <span className="font-bold text-xs text-amber-600">SUPER_ADMIN (Bosh Administrator)</span>
              </Option>
            )}
          </Select>
        </div>

        {/* Modal Buttons */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 mt-2">
          <Button onClick={onClose} disabled={isSubmitting} className="!rounded-lg text-xs">
            Bekor qilish
          </Button>
          <Button
            type="primary"
            onClick={handleSubmit}
            loading={isSubmitting}
            className="!bg-amber-600 hover:!bg-amber-700 !rounded-lg text-xs font-bold"
          >
            O'zgarishlarni Saqlash
          </Button>
        </div>
      </div>
    </Modal>
  );
}
