// ══════════════════════════════════════════════════════
// SENTINEL — Vietnamese Localization Constants
// Hệ thống Giám sát Giao thông Thông minh
// ══════════════════════════════════════════════════════

export const vi = {
  // ── App ─────────────────────────────────────────
  app: {
    name: 'SENTINEL',
    subtitle: 'Giao thông AI',
    loading: 'Đang tải hệ thống...',
    loadingModule: 'Đang tải mô-đun...',
  },

  // ── Sidebar Navigation ─────────────────────────
  nav: {
    dashboard: 'Bảng điều khiển',
    liveMonitoring: 'Giám sát Trực tiếp',
    aiDetection: 'Nhận diện AI',
    violations: 'Vi phạm & OCR',
    droneControl: 'Điều khiển Drone',
    analytics: 'Phân tích Giao thông',
    aiAssistant: 'Trợ lý AI',
    architecture: 'Kiến trúc Hệ thống',
    settings: 'Cài đặt',
    collapse: 'Thu gọn',
  },

  // ── Header ─────────────────────────────────────
  header: {
    aiEngine: 'AI Engine',
    online: 'Đang hoạt động',
    offline: 'Ngừng hoạt động',
    drones: 'Drone',
    weather: 'Thời tiết',
    latency: 'Độ trễ',
    partlyCloudy: '32°C Có mây',
    notifications: 'Thông báo',
    markAllRead: 'Đánh dấu đã đọc',
    settings: 'Cài đặt',
    signOut: 'Đăng xuất',
  },

  // ── Dashboard ──────────────────────────────────
  dashboard: {
    title: 'Trung tâm Chỉ huy',
    subtitle: 'Tổng quan tình báo giao thông thời gian thực',
    generateReport: 'Xuất Báo cáo',
    // KPIs
    totalVehicles: 'Tổng phương tiện',
    activeDrones: 'Drone hoạt động',
    avgSpeed: 'Tốc độ TB',
    ocrSuccess: 'OCR Thành công',
    violationsToday: 'Vi phạm hôm nay',
    aiAccuracy: 'Độ chính xác AI',
    vsLastHr: 'so với giờ trước',
    // Charts
    trafficFlow24h: 'Lưu lượng Giao thông — 24h',
    vehicleCountPerHour: 'Số phương tiện theo giờ',
    live: 'Trực tiếp',
    vehicleDistribution: 'Phân bố Phương tiện',
    classificationBreakdown: 'Phân loại chi tiết',
    total: 'TỔNG',
    // Drone Fleet
    liveDroneFleet: 'Đội Drone Trực chiến',
    fleetStatus: 'Trạng thái đội bay',
    battery: 'Pin',
    altitude: 'Độ cao',
    signal: 'Tín hiệu',
    mission: 'Nhiệm vụ',
    // Alerts
    recentAlerts: 'Cảnh báo Gần đây',
    criticalEvents: 'Sự kiện nghiêm trọng',
  },

  // ── Live Monitoring ────────────────────────────
  monitoring: {
    title: 'Giám sát Trực tiếp',
    subtitle: 'Luồng giám sát drone AI thời gian thực',
    rec: 'GHI',
    aiOverlay: 'Lớp phủ AI',
    snapshot: 'Chụp ảnh',
    record: 'Ghi hình',
    fullscreen: 'Toàn màn hình',
    droneSelector: 'Chọn Drone',
    // Telemetry
    droneTelemetry: 'Đo xa Drone',
    speed: 'Tốc độ',
    cameraAngle: 'Góc Camera',
    uptime: 'Thời gian bay',
    // Detection Feed
    detectionFeed: 'Luồng Nhận diện',
    autoUpdate: 'Cập nhật tự động',
    // Multi-drone
    multiDroneGrid: 'Lưới Đa Drone',
    clickToSwitch: 'Nhấn để chuyển',
    // Alert bar
    alertBar: 'Dải cảnh báo',
    speedViolation: 'Vi phạm tốc độ',
  },

  // ── AI Detection ───────────────────────────────
  detection: {
    title: 'Bộ Nhận diện AI',
    subtitle: 'Hệ thống nhận diện vật thể YOLOv8 + ByteTrack thời gian thực',
    modelStatus: 'Trạng thái Mô hình',
    activeTracks: 'Đối tượng theo dõi',
    successRate: 'Tỉ lệ thành công',
    processingPipeline: 'Đường ống Xử lý',
    // Detection view
    detectionVisualization: 'Trực quan Nhận diện',
    confidenceThreshold: 'Ngưỡng Tin cậy',
    vehicleClassDistribution: 'Phân bố Loại phương tiện',
    // Charts
    confidenceDistribution: 'Phân bố Độ tin cậy',
    detectionRate: 'Tốc độ Nhận diện',
    detectionsPerMinute: 'Nhận diện/phút',
    // Table
    detectionLog: 'Nhật ký Nhận diện',
    time: 'Thời gian',
    trackId: 'Mã theo dõi',
    vehicleType: 'Loại xe',
    confidence: 'Độ tin cậy',
    status: 'Trạng thái',
    tracked: 'Đang theo dõi',
    lost: 'Mất dấu',
  },

  // ── Violations & OCR ───────────────────────────
  violations: {
    title: 'Vi phạm & OCR',
    subtitle: 'Phát hiện vi phạm giao thông và nhận dạng biển số bằng AI',
    exportPdf: 'Xuất PDF',
    search: 'Tìm kiếm vi phạm...',
    // Stats
    totalViolations: 'Tổng vi phạm',
    speeding: 'Quá tốc độ',
    redLight: 'Vượt đèn đỏ',
    wrongLane: 'Sai làn đường',
    illegalParking: 'Đỗ xe trái phép',
    oppositeDirection: 'Đi ngược chiều',
    // Filters
    allTypes: 'Tất cả loại',
    allStatus: 'Tất cả trạng thái',
    // Table headers
    timestamp: 'Thời gian',
    snapshot: 'Ảnh chụp',
    licensePlate: 'Biển số xe',
    violationType: 'Loại vi phạm',
    ocrScore: 'Điểm OCR',
    aiConfidence: 'Độ tin cậy AI',
    actions: 'Thao tác',
    view: 'Xem',
    // Status
    pending: 'Chờ xử lý',
    confirmed: 'Đã xác nhận',
    dismissed: 'Bác bỏ',
    // Modal
    evidenceDetail: 'Chi tiết Bằng chứng',
    violationInfo: 'Thông tin Vi phạm',
    ocrResult: 'Kết quả OCR',
    aiAnalysis: 'Phân tích AI',
    confirm: 'Xác nhận',
    dismiss: 'Bác bỏ',
    close: 'Đóng',
  },

  // ── Drone Control ──────────────────────────────
  droneControl: {
    title: 'Trung tâm Điều khiển Drone',
    subtitle: 'Quản lý đội bay và điều phối nhiệm vụ',
    emergencyLanding: 'Hạ cánh Khẩn cấp',
    // Tactical Map
    tacticalMap: 'BẢN ĐỒ CHIẾN THUẬT',
    // Drone states
    active: 'Hoạt động',
    idle: 'Chờ lệnh',
    returning: 'Đang về',
    emergency: 'Khẩn cấp',
    // Telemetry
    telemetryPanel: 'Bảng Đo xa',
    gps: 'Toạ độ',
    // Controls
    startMission: 'Bắt đầu',
    returnHome: 'Quay về',
    autoPatrol: 'Tuần tra',
    cameraRotate: 'Xoay Camera',
    zoom: 'Phóng to',
    emergencyLand: 'Hạ cánh KC',
    // Mission log
    missionLog: 'Nhật ký Nhiệm vụ',
  },

  // ── Traffic Analytics ──────────────────────────
  analytics: {
    title: 'Phân tích Giao thông',
    subtitle: 'Phân tích lưu lượng và xu hướng giao thông toàn diện',
    // Time range
    timeRange: 'Khung thời gian',
    // KPIs
    peakHourVolume: 'Lưu lượng Giờ cao điểm',
    avgCongestion: 'Tắc nghẽn TB',
    totalDetections: 'Tổng Nhận diện',
    avgTravelSpeed: 'Tốc độ Di chuyển TB',
    // Charts
    trafficVolumeVsSpeed: 'Lưu lượng vs Tốc độ',
    volumeLabel: 'Lưu lượng',
    speedLabel: 'Tốc độ (km/h)',
    congestionHeatmap: 'Bản đồ Nhiệt Tắc nghẽn',
    congestionLevel: 'Mức tắc nghẽn',
    vehicleComposition: 'Cơ cấu Phương tiện',
    laneAnalysis: 'Phân tích Làn đường',
    // Lane table
    lane: 'Làn',
    vehicles: 'Phương tiện',
    density: 'Mật độ',
    low: 'Thấp',
    moderate: 'Trung bình',
    high: 'Cao',
    critical: 'Nguy cấp',
    // Hotspots
    congestionHotspots: 'Điểm nóng Tắc nghẽn',
    location: 'Vị trí',
    severity: 'Mức độ',
    estimatedDelay: 'Chậm trễ ước tính',
  },

  // ── AI Assistant ───────────────────────────────
  assistant: {
    title: 'Trợ lý AI',
    subtitle: 'Phân tích giao thông thông minh và tư vấn điều hành',
    placeholder: 'Nhập câu hỏi về giao thông, vi phạm, drone...',
    send: 'Gửi',
    thinking: 'Đang phân tích...',
    suggestedQuestions: 'Câu hỏi gợi ý',
    clearChat: 'Xoá cuộc trò chuyện',
    welcomeTitle: 'Xin chào! Tôi là SENTINEL AI',
    welcomeMessage: 'Tôi có thể phân tích dữ liệu giao thông, tình trạng drone, vi phạm và đưa ra khuyến nghị. Hãy hỏi tôi bất cứ điều gì.',
  },

  // ── System Architecture ────────────────────────
  architecture: {
    title: 'Kiến trúc Hệ thống',
    subtitle: 'Tổng quan đường ống xử lý AI và hạ tầng',
    dataProcessingPipeline: 'Đường ống Xử lý Dữ liệu',
    technologyStack: 'Ngăn xếp Công nghệ',
    liveSystemMetrics: 'Chỉ số Hệ thống Trực tiếp',
    // Pipeline
    droneFleet: 'Đội Drone',
    videoStream: 'Luồng Video',
    detection: 'Nhận diện',
    tracking: 'Theo dõi',
    plateRecognition: 'Nhận dạng Biển số',
    database: 'Cơ sở Dữ liệu',
    dashboard: 'Bảng điều khiển',
    // Legend
    onlineLabel: 'Trực tuyến',
    dataFlow: 'Luồng Dữ liệu',
    activeTransfer: 'Đang truyền',
    // Infra
    frontend: 'Giao diện',
    backend: 'Hệ thống Backend',
    aiEngineLabel: 'AI Engine',
    databaseLabel: 'Cơ sở Dữ liệu',
    streaming: 'Truyền phát',
    deployment: 'Triển khai',
    // Perf
    processingLatency: 'Độ trễ Xử lý',
    throughput: 'Thông lượng',
    gpuUtilization: 'Sử dụng GPU',
    memoryUsage: 'Bộ nhớ',
  },

  // ── Login ──────────────────────────────────────
  login: {
    title: 'Đăng nhập Hệ thống',
    subtitle: 'Trung tâm Giám sát Giao thông AI',
    email: 'Email',
    emailPlaceholder: 'Nhập địa chỉ email...',
    password: 'Mật khẩu',
    passwordPlaceholder: 'Nhập mật khẩu...',
    rememberMe: 'Ghi nhớ đăng nhập',
    forgotPassword: 'Quên mật khẩu?',
    signIn: 'Đăng nhập',
    signingIn: 'Đang xác thực...',
    noAccount: 'Chưa có tài khoản?',
    createAccount: 'Đăng ký ngay',
    securedBy: 'Bảo mật bởi',
  },

  // ── Register ───────────────────────────────────
  register: {
    title: 'Tạo Tài khoản',
    subtitle: 'Đăng ký truy cập hệ thống SENTINEL',
    fullName: 'Họ và tên',
    fullNamePlaceholder: 'Nhập họ và tên...',
    email: 'Email',
    emailPlaceholder: 'Nhập địa chỉ email...',
    password: 'Mật khẩu',
    passwordPlaceholder: 'Tạo mật khẩu mạnh...',
    confirmPassword: 'Xác nhận mật khẩu',
    confirmPasswordPlaceholder: 'Nhập lại mật khẩu...',
    agreeTerms: 'Tôi đồng ý với',
    termsOfService: 'Điều khoản Dịch vụ',
    and: 'và',
    privacyPolicy: 'Chính sách Bảo mật',
    createAccount: 'Tạo Tài khoản',
    creating: 'Đang tạo tài khoản...',
    hasAccount: 'Đã có tài khoản?',
    signIn: 'Đăng nhập',
  },

  // ── Settings ───────────────────────────────────
  settings: {
    title: 'Cài đặt',
    subtitle: 'Cấu hình hệ thống và tuỳ chỉnh',
    // General
    general: 'Tổng quát',
    systemName: 'Tên hệ thống',
    systemNameDesc: 'Định danh cho phiên bản SENTINEL này',
    language: 'Ngôn ngữ',
    timezone: 'Múi giờ',
    darkMode: 'Chế độ tối',
    darkModeDesc: 'Mặc định hệ thống — không thể thay đổi',
    locked: 'KHOÁ',
    // AI Config
    aiConfig: 'Cấu hình AI',
    detectionModel: 'Mô hình Nhận diện',
    detectionModelDesc: 'Biến thể YOLO cho nhận diện vật thể',
    confidenceThreshold: 'Ngưỡng Tin cậy',
    confidenceThresholdDesc: 'Điểm tin cậy nhận diện tối thiểu',
    maxTrackAge: 'Tuổi Theo dõi Tối đa',
    maxTrackAgeDesc: 'Số khung hình trước khi huỷ theo dõi',
    ocrEngine: 'OCR Engine',
    ocrEngineDesc: 'Hệ thống nhận dạng biển số',
    autoDetectViolations: 'Tự động Phát hiện Vi phạm',
    autoDetectViolationsDesc: 'Phát hiện vi phạm tự động bằng AI',
    // Notifications
    notifications: 'Thông báo',
    pushNotifications: 'Thông báo đẩy',
    pushNotificationsDesc: 'Thông báo đẩy qua trình duyệt',
    emailAlerts: 'Cảnh báo Email',
    emailAlertsDesc: 'Gửi cảnh báo đến email quản trị',
    soundAlerts: 'Cảnh báo Âm thanh',
    soundAlertsDesc: 'Phát âm thanh cảnh báo',
    criticalViolationAlerts: 'Cảnh báo Vi phạm Nghiêm trọng',
    criticalViolationAlertsDesc: 'Cảnh báo tức thì cho sự kiện nghiêm trọng',
    droneBatteryAlerts: 'Cảnh báo Pin Drone',
    droneBatteryAlertsDesc: 'Cảnh báo khi pin drone sắp hết',
    // API
    apiIntegration: 'API & Tích hợp',
    apiKey: 'Khoá API',
    apiKeyDesc: 'Khoá xác thực cho truy cập bên ngoài',
    webhookUrl: 'Webhook URL',
    webhookUrlDesc: 'Điểm nhận thông báo sự kiện',
    rateLimit: 'Giới hạn Truy vấn',
    rateLimitDesc: 'Số yêu cầu API tối đa mỗi phút',
    regenerateKey: 'Tạo lại Khoá',
    regenerateKeyDesc: 'Huỷ khoá cũ và tạo khoá mới',
    // System Info
    systemInfo: 'Thông tin Hệ thống',
    version: 'Phiên bản',
    lastUpdated: 'Cập nhật lần cuối',
    // Actions
    save: 'Lưu Cấu hình',
    saving: 'Đang lưu...',
  },

  // ── Common ─────────────────────────────────────
  common: {
    loading: 'Đang tải...',
    error: 'Lỗi',
    retry: 'Thử lại',
    cancel: 'Huỷ',
    confirm: 'Xác nhận',
    close: 'Đóng',
    back: 'Quay lại',
    next: 'Tiếp tục',
    save: 'Lưu',
    delete: 'Xoá',
    edit: 'Chỉnh sửa',
    noData: 'Không có dữ liệu',
    // Vehicle types
    car: 'Ô tô',
    motorbike: 'Xe máy',
    truck: 'Xe tải',
    bus: 'Xe buýt',
    person: 'Người đi bộ',
    bicycle: 'Xe đạp',
  },

  // ── Alerts / Store ─────────────────────────────
  alerts: {
    speedViolation: 'Phát hiện Vi phạm Tốc độ',
    speedViolationMsg: 'Phương tiện 59A-12345 vượt quá 80km/h trên Nguyễn Trãi lúc 10:23',
    droneLowBattery: 'Drone D-03 Pin yếu',
    droneLowBatteryMsg: 'Pin còn 18%. Đã khởi động tự động quay về.',
    aiModelUpdated: 'Cập nhật Mô hình AI',
    aiModelUpdatedMsg: 'Trọng số YOLOv8 đã đồng bộ. Độ chính xác nhận diện tăng lên 96.2%.',
    redLightViolation: 'Vi phạm Đèn đỏ',
    redLightViolationMsg: 'Xe buýt tại ngã tư Lê Lợi - Hàm Nghi vượt đèn đỏ.',
    highCongestion: 'Cảnh báo Tắc nghẽn Cao',
    highCongestionMsg: 'Mật độ giao thông nghiêm trọng trên tuyến Võ Văn Kiệt.',
    timeAgo2m: '2 phút trước',
    timeAgo5m: '5 phút trước',
    timeAgo12m: '12 phút trước',
    timeAgo18m: '18 phút trước',
    timeAgo25m: '25 phút trước',
  },

  // ── Violation Labels ───────────────────────────
  violationLabels: {
    wrong_lane: 'Sai làn đường',
    red_light: 'Vượt đèn đỏ',
    opposite_direction: 'Đi ngược chiều',
    illegal_parking: 'Đỗ xe trái phép',
    speeding: 'Quá tốc độ',
  } as Record<string, string>,
} as const;

export type Vi = typeof vi;
export default vi;
