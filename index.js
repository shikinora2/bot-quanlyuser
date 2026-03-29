const { 
    Client, 
    GatewayIntentBits, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    ModalBuilder, 
    TextInputBuilder, 
    TextInputStyle, 
    StringSelectMenuBuilder, 
    Events, 
    REST, 
    Routes, 
    SlashCommandBuilder, 
    EmbedBuilder 
} = require('discord.js');
const fs = require('fs');
const path = require('path');

// ==========================================
// ⚙️ 1. CẤU HÌNH BOT QUA BIẾN MÔI TRƯỜNG
// ==========================================
const ENV_FILE_VPS = path.join(__dirname, '.env.vps');
const ENV_FILE_LOCAL = path.join(__dirname, '.env');

function loadEnvFile(filePath) {
    const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);

    for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line || line.startsWith('#')) continue;

        const equalsIndex = line.indexOf('=');
        if (equalsIndex === -1) continue;

        const key = line.slice(0, equalsIndex).trim();
        let value = line.slice(equalsIndex + 1).trim();

        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
        }

        if (!(key in process.env)) {
            process.env[key] = value;
        }
    }
}

if (fs.existsSync(ENV_FILE_VPS)) {
    loadEnvFile(ENV_FILE_VPS);
    console.log('📦 Đang dùng biến môi trường từ file .env.vps');
} else if (fs.existsSync(ENV_FILE_LOCAL)) {
    loadEnvFile(ENV_FILE_LOCAL);
    console.log('📦 Đang dùng biến môi trường từ file .env');
}

const TOKEN = process.env.BOT_TOKEN;
const APP_ID = process.env.APP_ID;

if (!TOKEN) {
    console.error('❌ Thiếu BOT_TOKEN. Hãy tạo file .env hoặc .env.vps và khai báo BOT_TOKEN.');
    process.exit(1);
}

// ==========================================
// 📂 2. HỆ THỐNG LƯU TRỮ CẤU HÌNH (TỰ ĐỘNG)
// ==========================================
const CONFIG_FILE = './config.json';
let dbConfig = { channels: {}, roles: { he_phai: {} } };

if (fs.existsSync(CONFIG_FILE)) {
    dbConfig = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
} else {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(dbConfig, null, 4));
}

function saveConfig() {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(dbConfig, null, 4));
}

// ==========================================
// 🚀 3. KHỞI TẠO BOT & LỆNH SLASH (GLOBAL)
// ==========================================
const client = new Client({ 
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] 
});

const userFormData = new Map();

client.once(Events.ClientReady, async c => {
    console.log(`✅ Bot ${c.user.tag} đã sẵn sàng hoạt động!`);

    const rest = new REST({ version: '10' }).setToken(TOKEN);
    const applicationId = APP_ID || c.user.id;
    const commands = [
        new SlashCommandBuilder()
            .setName('setup-form')
            .setDescription('Gửi bảng đăng ký thành viên (Chỉ Admin)')
            .setDefaultMemberPermissions(8),
            
        new SlashCommandBuilder()
            .setName('set-channel')
            .setDescription('Cấu hình kênh cho hệ thống (Chỉ Admin)')
            .setDefaultMemberPermissions(8)
            .addStringOption(option => 
                option.setName('loai_kenh')
                .setDescription('Chọn loại kênh cần cài đặt')
                .setRequired(true)
                .addChoices(
                    { name: 'Kênh Đăng Ký (Nơi để bot gửi form)', value: 'dangky' },
                    { name: 'Kênh Log (Nơi bot gửi báo cáo)', value: 'log' }
                ))
            .addChannelOption(option => 
                option.setName('kenh')
                .setDescription('Chọn kênh tương ứng')
                .setRequired(true)),

        new SlashCommandBuilder()
            .setName('set-role')
            .setDescription('Cấu hình Role cho hệ thống (Chỉ Admin)')
            .setDefaultMemberPermissions(8)
            .addStringOption(option => 
                option.setName('loai_role')
                .setDescription('Chọn loại Role cần cài đặt')
                .setRequired(true)
                .addChoices(
                    { name: 'Role Bang Chúng (Mặc định)', value: 'bangchung' },
                    { name: 'Phái: Huyết Hà', value: 'huyetha' },
                    { name: 'Phái: Tố Vấn', value: 'tovan' },
                    { name: 'Phái: Thiết Y', value: 'thiety' },
                    { name: 'Phái: Thần Tướng', value: 'thantuong' },
                    { name: 'Phái: Toái Mộng', value: 'toaimong' },
                    { name: 'Phái: Cửu Linh', value: 'cuulinh' },
                    { name: 'Phái: Long Ngâm', value: 'longngam' }
                ))
            .addRoleOption(option => 
                option.setName('role')
                .setDescription('Tag Role tương ứng')
                .setRequired(true))
    ].map(command => command.toJSON());

    try {
        console.log('⏳ Đang cập nhật hệ thống lệnh Slash Toàn Cầu...');
        // Ưu tiên APP_ID trong file env; nếu thiếu thì dùng ID bot hiện tại.
        await rest.put(Routes.applicationCommands(applicationId), { body: commands });
        console.log('✅ Cập nhật lệnh Slash thành công! Bot có thể dùng ở mọi server.');
    } catch (error) {
        console.error('❌ Lỗi đăng ký lệnh:', error);
    }
});

// ==========================================
// 🎮 4. XỬ LÝ LOGIC TƯƠNG TÁC CHÍNH
// ==========================================
client.on(Events.InteractionCreate, async interaction => {
    
    // --- PHẦN 1: ADMIN SỬ DỤNG LỆNH CẤU HÌNH ---
    if (interaction.isChatInputCommand()) {
        if (interaction.commandName === 'set-channel') {
            const loaiKenh = interaction.options.getString('loai_kenh');
            const kenh = interaction.options.getChannel('kenh');
            
            dbConfig.channels[loaiKenh] = kenh.id;
            saveConfig();
            return interaction.reply({ content: `✅ Đã lưu kênh <#${kenh.id}> cho chức năng: **${loaiKenh}**`, ephemeral: true });
        }

        if (interaction.commandName === 'set-role') {
            const loaiRole = interaction.options.getString('loai_role');
            const role = interaction.options.getRole('role');
            
            if (loaiRole === 'bangchung') {
                dbConfig.roles.bangchung = role.id;
            } else {
                dbConfig.roles.he_phai[loaiRole] = role.id;
            }
            saveConfig();
            return interaction.reply({ content: `✅ Đã liên kết role <@&${role.id}> cho chức năng: **${loaiRole}**`, ephemeral: true });
        }

        if (interaction.commandName === 'setup-form') {
            const kenhDangKyId = dbConfig.channels.dangky;
            if (!kenhDangKyId) return interaction.reply({ content: '❌ Admin chưa setup Kênh Đăng Ký. Vui lòng dùng lệnh `/set-channel` trước!', ephemeral: true });

            const channel = client.channels.cache.get(kenhDangKyId);
            if (!channel) return interaction.reply({ content: '❌ Không tìm thấy kênh đăng ký (có thể kênh đã bị xóa).', ephemeral: true });
            
            const registerButton = new ButtonBuilder()
                .setCustomId('btn_dangky')
                .setLabel('📝 Bắt Đầu Đăng Ký')
                .setStyle(ButtonStyle.Primary);

            const welcomeEmbed = new EmbedBuilder()
                .setColor('#3498db') 
                .setTitle('🌟 CHÀO MỪNG BẠN ĐẾN VỚI SERVER 🌟')
                .setDescription(
                    'Để có thể nhìn thấy các kênh chat và giao lưu cùng mọi người, bạn vui lòng hoàn tất thủ tục **Đăng Ký Thành Viên** nhé!\n\n' +
                    '**📜 Hướng dẫn các bước:**\n' +
                    '> **Bước 1:** Bấm vào nút bên dưới để khai báo Tên nhân vật và Năm sinh.\n' +
                    '> **Bước 2:** Lựa chọn Giới tính và Hệ phái của bạn.\n' +
                    '> **Bước 3:** Bấm Hoàn tất để hệ thống tự động mở khóa server.\n\n' +
                    '*⚠️ Lưu ý: Tên hiển thị của bạn trên Discord sẽ tự động được đổi thành tên nhân vật trong game.*'
                )
                .setFooter({ text: 'Hệ thống quản lý tự động' });

            await channel.send({ embeds: [welcomeEmbed], components: [new ActionRowBuilder().addComponents(registerButton)] });
            return interaction.reply({ content: `✅ Đã gửi bảng đăng ký vào kênh <#${kenhDangKyId}>!`, ephemeral: true });
        }
    }

    // --- PHẦN 2: USER BẤM NÚT ĐĂNG KÝ -> HIỆN MODAL ---
    if (interaction.isButton() && interaction.customId === 'btn_dangky') {
        const modal = new ModalBuilder().setCustomId('modal_nhap_thongtin').setTitle('Bước 1: Khai Báo Thông Tin');
        
        const inputTen = new TextInputBuilder().setCustomId('input_ten').setLabel('Tên nhân vật trong game của bạn?').setStyle(TextInputStyle.Short).setRequired(true);
        const inputNamSinh = new TextInputBuilder().setCustomId('input_namsinh').setLabel('Năm sinh của bạn? (VD: 2000)').setStyle(TextInputStyle.Short).setMaxLength(4).setRequired(true);

        modal.addComponents(new ActionRowBuilder().addComponents(inputTen), new ActionRowBuilder().addComponents(inputNamSinh));
        await interaction.showModal(modal);
    }

    // --- PHẦN 3: USER SUBMIT MODAL -> HIỆN MENU CHỌN PHÁI ---
    if (interaction.isModalSubmit() && interaction.customId === 'modal_nhap_thongtin') {
        const tenInGame = interaction.fields.getTextInputValue('input_ten');
        const namSinh = interaction.fields.getTextInputValue('input_namsinh');

        userFormData.set(interaction.user.id, { ten: tenInGame, namSinh: namSinh, gioiTinh: null, phai: null });

        const menuGioiTinh = new StringSelectMenuBuilder()
            .setCustomId('select_gioitinh')
            .setPlaceholder('Chọn Giới tính...')
            .addOptions([{ label: 'Nam', value: 'Nam' }, { label: 'Nữ', value: 'Nữ' }]);

        const menuPhai = new StringSelectMenuBuilder()
            .setCustomId('select_phai')
            .setPlaceholder('Chọn Hệ phái...')
            .addOptions([
                { label: 'Huyết Hà', value: 'huyetha' }, { label: 'Tố Vấn', value: 'tovan' },
                { label: 'Thiết Y', value: 'thiety' }, { label: 'Thần Tướng', value: 'thantuong' },
                { label: 'Toái Mộng', value: 'toaimong' }, { label: 'Cửu Linh', value: 'cuulinh' },
                { label: 'Long Ngâm', value: 'longngam' }
            ]);

        const btnHoanTat = new ButtonBuilder().setCustomId('btn_hoantat_dangky').setLabel('✅ Hoàn Tất Đăng Ký').setStyle(ButtonStyle.Success);

        await interaction.reply({
            content: `Chào **${tenInGame}**! Bước cuối cùng, hãy chọn Giới tính và Hệ phái bên dưới:`,
            components: [
                new ActionRowBuilder().addComponents(menuGioiTinh),
                new ActionRowBuilder().addComponents(menuPhai),
                new ActionRowBuilder().addComponents(btnHoanTat)
            ],
            ephemeral: true
        });
    }

    // --- PHẦN 4: LƯU TẠM LỰA CHỌN TỪ MENU ---
    if (interaction.isStringSelectMenu()) {
        const userData = userFormData.get(interaction.user.id);
        if (!userData) return interaction.reply({ content: 'Form đã hết hạn, vui lòng bấm đăng ký lại từ đầu!', ephemeral: true });

        if (interaction.customId === 'select_gioitinh') userData.gioiTinh = interaction.values[0];
        if (interaction.customId === 'select_phai') userData.phai = interaction.values[0];

        await interaction.deferUpdate();
    }

    // --- PHẦN 5: BẤM HOÀN TẤT -> XỬ LÝ ROLE, ĐỔI TÊN & GỬI LOG ---
    if (interaction.isButton() && interaction.customId === 'btn_hoantat_dangky') {
        const userData = userFormData.get(interaction.user.id);
        if (!userData || !userData.gioiTinh || !userData.phai) return interaction.reply({ content: '⚠️ Bạn phải chọn đầy đủ Giới tính và Hệ phái trước khi bấm Hoàn tất!', ephemeral: true });

        const roleBangChungId = dbConfig.roles.bangchung;
        const rolePhaiId = dbConfig.roles.he_phai[userData.phai];

        if (!roleBangChungId || !rolePhaiId) {
            return interaction.reply({ content: '❌ Lỗi hệ thống: Admin chưa thiết lập đủ Role. Vui lòng báo Admin!', ephemeral: true });
        }

        const TEN_HE_PHAI = {
            'huyetha': 'Huyết Hà', 'tovan': 'Tố Vấn', 'thiety': 'Thiết Y', 
            'thantuong': 'Thần Tướng', 'toaimong': 'Toái Mộng', 'cuulinh': 'Cửu Linh', 'longngam': 'Long Ngâm'
        };

        try {
            const member = interaction.member;

            // 1. Quét và Xóa role phái cũ (nếu người dùng đổi phái)
            const tatCaRoleHePhaiIds = Object.values(dbConfig.roles.he_phai);
            const roleCuCanXoa = member.roles.cache
                .filter(role => tatCaRoleHePhaiIds.includes(role.id))
                .map(role => role.id);

            if (roleCuCanXoa.length > 0) {
                await member.roles.remove(roleCuCanXoa);
            }

            // 2. Cấp Role mới
            await member.roles.add([roleBangChungId, rolePhaiId]);
            
            // 3. Đổi Nickname
            await member.setNickname(userData.ten).catch(() => {});

            // 4. Báo cáo thành công cho User
            await interaction.update({ content: `🎉 **${userData.ten}** đã cập nhật thông tin thành công!`, components: [] });

            // 5. Gửi Embed Log cho Admin
            const kenhLogId = dbConfig.channels.log;
            if (kenhLogId) {
                const logChannel = client.channels.cache.get(kenhLogId);
                if (logChannel) {
                    const embedLog = new EmbedBuilder()
                        .setColor('#00FF00') 
                        .setTitle(roleCuCanXoa.length > 0 ? '🔄 Báo Cáo: Thành Viên Chuyển Phái / Đổi Tên' : '📝 Báo Cáo: Thành Viên Mới')
                        .setThumbnail(interaction.user.displayAvatarURL()) 
                        .addFields(
                            { name: 'Tên nhân vật', value: userData.ten, inline: false },
                            { name: 'Giới tính', value: userData.gioiTinh, inline: true },
                            { name: 'Năm sinh', value: userData.namSinh, inline: true },
                            { name: 'Hệ phái', value: TEN_HE_PHAI[userData.phai], inline: true }
                        )
                        .setTimestamp();

                    logChannel.send({ content: `<@${interaction.user.id}> vừa hoàn tất biểu mẫu:`, embeds: [embedLog] });
                }
            }

            // 6. Xóa dữ liệu tạm
            userFormData.delete(interaction.user.id);

        } catch (error) {
            console.error(error);
            await interaction.update({ content: '❌ Có lỗi xảy ra khi cập nhật quyền! Vui lòng kiểm tra lại quyền của Bot.', components: [] });
        }
    }
});

client.login(TOKEN);