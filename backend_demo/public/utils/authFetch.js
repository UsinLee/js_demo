export async function authFetch(url, options = {}) {
    let currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
    const refreshToken = localStorage.getItem("refreshToken");
  
    // 기본 headers 추가
    options.headers = options.headers || {};
    if (currentUser.token) {
      options.headers["Authorization"] = `Bearer ${currentUser.token}`;
    }
  
    let response = await fetch(url, options);
  
    // Access Token 만료 시 Refresh Token으로 재발급 요청
    if (response.status === 401 && refreshToken) {
      try {
        const refreshRes = await fetch("http://localhost:4000/users/refresh", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ refreshToken })
        });
  
        const refreshData = await refreshRes.json();
  
        if (refreshRes.ok) {
          // 새 Access Token 저장
          currentUser.token = refreshData.accessToken;
          localStorage.setItem("currentUser", JSON.stringify(currentUser));
  
          // 원래 요청 다시 시도
          options.headers["Authorization"] = `Bearer ${refreshData.accessToken}`;
          response = await fetch(url, options);
        } else {
          throw new Error("토큰 재발급 실패");
        }
      } catch (err) {
        console.error("토큰 갱신 실패:", err);
        localStorage.removeItem("currentUser");
        localStorage.removeItem("refreshToken");
        alert("로그인이 만료되었습니다. 다시 로그인해주세요.");
        window.location.href = "login.html";
      }
    }
  
    return response;
  }
  