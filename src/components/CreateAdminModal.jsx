import React, { useState } from "react";
import { Modal, Input, Select, Button, message, Space, Alert } from "antd";
import { UserPlus, Key, Shield, Phone, User, RefreshCw, Eye, EyeOff } from "lucide-react";
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

export default function CreateAdminModal({
  visible,
  onClose,
  onSuccess,
  currentAdminRole = "SUPER_ADMIN",
}) {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("+998");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("ADMIN");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isSuperAdmin = currentAdminRole === "SUPER_ADMIN";

  const handleGeneratePassword = () => {
    const generated = generateStrongPassword();
    setPassword(generated);
  };

  const handleSubmit = async () => {
    if (!username.trim()) {
      message.error("Foydalanuvchi nomi (username) kiritilishi shart");
      return;
    }
    if (!phone.trim() || phone.replace(/\D/g, "").length < 9) {
      message.error("To'liq telefon raqamini kiriting (+998901234567)");
      return;
    }
    if (!password || password.length < 6) {
      message.error("Parol kamida 6 ta belgidan iborat bo'lishi kerak");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        fullName: fullName.trim() || undefined,
        phone: phone.trim(),
        username: username.trim(),
        password,
        role,
      };

      const res = await api.post("/admin/users/create-admin", payload);
      message.success(res.data?.message || `Yangi ${role} muvaffaqiyatli yaratildi!`);
      
      // Reset form
      setFullName("");
      setPhone("+998");
      setUsername("");
      setPassword("");
      setRole("ADMIN");

      if (onSuccess) onSuccess();
      if (onClose) onClose();
    } catch (err) {
      const errMsg = err?.response?.data?.message || "Admin yaratishda xatolik yuz berdi";
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
          <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center">
            <UserPlus className="w-4 h-4" />
          </div>
          <span>Yangi Admin / Xodim Yaratish</span>
        </div>
      }
    >
      <div className="flex flex-col gap-4 py-2">
        <Alert
          type="info"
          showIcon
          message="Yangi admin akkaunti darhol faollashtiriladi"
          description="Yaratilgan login va parolni xodimga xavfsiz kanallar orqali taqdim eting. U to'g'ridan-to'g'ri admin paneliga kira oladi."
          className="text-xs"
        />

        {/* Full Name */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            To'liq ism (F.I.SH)
          </label>
          <Input
            prefix={<User className="w-4 h-4 text-slate-400 mr-1" />}
            placeholder="Masalan: Sardor Komilov"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="!rounded-lg text-xs py-2"
          />
        </div>

        {/* Phone */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Telefon raqami (Login sifatida ishlatiladi) *
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
            placeholder="admin_sardor"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="!rounded-lg text-xs py-2"
          />
        </div>

        {/* Password */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-bold text-slate-700">
              Kirish paroli *
            </label>
            <button
              type="button"
              onClick={handleGeneratePassword}
              className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold inline-flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" /> Tasodifiy parol generatsiya
            </button>
          </div>
          <Input.Password
            prefix={<Key className="w-4 h-4 text-slate-400 mr-1" />}
            placeholder="Kamida 6-8 ta belgi"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="!rounded-lg text-xs py-2 font-mono"
          />
        </div>

        {/* Role */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Tizimdagi vakolat roli *
          </label>
          <Select
            value={role}
            onChange={setRole}
            className="w-full !rounded-lg"
            size="large"
          >
            <Option value="ADMIN">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-purple-700">ADMIN</span>
                <span className="text-[10px] text-slate-400">Barcha tovar, foydalanuvchi va to'lovlarni boshqaradi</span>
              </div>
            </Option>
            <Option value="MODERATOR">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-blue-600">MODERATOR</span>
                <span className="text-[10px] text-slate-400">E'lonlarni tekshirish, spam va bloklash</span>
              </div>
            </Option>
            <Option value="SUPPORT">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-teal-600">SUPPORT</span>
                <span className="text-[10px] text-slate-400">Mijozlar shikoyatlari va bildirishnomalar</span>
              </div>
            </Option>
            {isSuperAdmin && (
              <Option value="SUPER_ADMIN">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-amber-600">SUPER_ADMIN</span>
                  <span className="text-[10px] text-slate-400">Tizim bo'yicha to'liq 100% cheklovsiz vakolat</span>
                </div>
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
            className="!bg-indigo-600 hover:!bg-indigo-700 !rounded-lg text-xs font-bold"
          >
            Yaratish va Saqlash
          </Button>
        </div>
      </div>
    </Modal>
  );
}
