export async function authFetch(url, options = {}) {
  let currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");

  const accessToken = currentUser.accessToken;
  const refreshToken = currentUser.refreshToken;

  if (!accessToken || !refreshToken) {
    throw new Error("로그인이 필요합니다.");
  }

  // 기본 headers 추가
  options.headers = options.headers || {};
  options.headers["Authorization"] = `Bearer ${accessToken}`;

  let response = await fetch(url, options);

  // Access Token 만료 시 Refresh Token으로 재발급 요청
  if (response.status === 401) {
    console.log('🔵 AccessToken 만료 감지');
    console.log('🔵 보내는 RefreshToken:', refreshToken);

    try {
      const refreshRes = await fetch("http://localhost:4000/users/refresh", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ refreshToken })
      });

      const refreshData = await refreshRes.json();
      console.log('🟡 서버에서 받은 refresh 결과:', refreshData);

      if (refreshRes.ok) {
        console.log('🟢 AccessToken 재발급 성공');

        // 새 AccessToken 저장
        currentUser.accessToken = refreshData.accessToken;
        localStorage.setItem("currentUser", JSON.stringify(currentUser));

        // 원래 요청 다시 시도
        options.headers["Authorization"] = `Bearer ${refreshData.accessToken}`;
        response = await fetch(url, options);
      } else {
        console.error("❌ 리프레시 실패:", refreshData.message);
        throw new Error("토큰 재발급 실패");
      }
    } catch (err) {
      console.error("토큰 갱신 실패:", err);
      localStorage.removeItem("currentUser");
      alert("로그인이 만료되었습니다. 다시 로그인해주세요.");
      window.location.href = "login.html";
    }
  }

  return response;
}
