const USERS_KEY = "expirycheck_users";
const SESSION_KEY = "expirycheck_current_users";
function getUsers() {
    const data = localStorage.getItem(USERS_KEY);
    if(!data) {
        return [];
    }
    return JSON.parse(data);
}
function saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
}
// Đăng ký tài khoản mới
function registerUser(fullName, username, email, password) {
    const users = getUsers();
    let usernameTaken = false;
    for(let i = 0; i<users.length; i++) {
        if(users[i].username.toLowerCase() === username.toLowerCase())
        {
            usernameTaken = true;
            break;

        }
    }
    if(usernameTaken) {
        return {
            success:false,
            message: "Tên đăng nhập đã tồn tại."
        };
    }
    let emailTaken = false;
    for(let i = 0; i < users.length; i++) {
        if(users[i].email.toLowerCase() === email.toLowerCase()) {
            emailTaken = true;
            break;
        }
    }
    if(emailTaken) {
        return {
            success: false,
            message: "Email đã được đăng ký."
        };
    }
    users.push({
        fullName: fullName,
        username: username,
        email: email,
        password: password
    });
    saveUsers(users);
    setCurrentUser(username);
    return {
        success: true
    };
}
// Đăng nhập
function loginUser(username, password) {
    const users = getUsers();
    let user = null;
    for (let i = 0; i < users.length; i++) {
        if(users[i].username.toLowerCase() === username.toLowerCase() && users[i].password === password) {
            user = users[i];
            break;
        }
    }
    if(!user) {
        return {
            success:false,
            message: "Sai tên đăng nhập hoặc mật khẩu."
        }
    }
    setCurrentUser(user.username);
    return{success:true};
}
function setCurrentUser(username) {
    localStorage.setItem(SESSION_KEY, username);
}
function getCurrentUser() {
    const username = localStorage.getItem(SESSION_KEY);
    if(!username){
        return null;
    }
    const users = getUsers();
    for (let i = 0; i <users.length; i++) {
        if(users[i].username === username) {
            return users[i];
        }
    }
    return null;
}
function logoutUser() { 
    localStorage.removeItem(SESSION_KEY);
}