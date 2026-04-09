import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  const login = async (email, password) => {
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      if (!res.ok) {
        const errorText = await res.text().catch(() => '连接服务器失败');
        let errorData;
        try { errorData = JSON.parse(errorText); } catch(e) {}
        throw new Error(errorData?.error || `服务器错误: ${res.status}`);
      }

      const data = await res.json();
      if (data.token) {
        setUser(data.user);
        setToken(data.token);
        return true;
      } else {
        throw new Error(data.error || '登录详情缺失');
      }
    } catch (e) {
      console.error('[Auth] Login Error:', e);
      if (e.message.includes('Unexpected end of JSON input') || e.message.includes('fetch')) {
         throw new Error('后端服务未启动，请联系 AI 项目经理重启。');
      }
      throw e;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
