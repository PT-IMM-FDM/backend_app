import { Client, LocalAuth } from "whatsapp-web.js";
import qrcode from "qrcode-terminal";
import { logger } from "../applications";
import { dataFdmTodayReport, dataFdmUnfit } from "../models/whatsapp_message";

export const clientWhatsapp = new Client({
  authStrategy: new LocalAuth(),
  restartOnAuthFail: true,
  puppeteer: {
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  },
  webVersionCache: {
    type: "remote",
    remotePath: `https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html`,
  },
});

clientWhatsapp.on("qr", (qr) => {
  qrcode.generate(qr, { small: true });
});

clientWhatsapp.on("ready", () => {
  console.log("Client is ready!");
  logger.info(`Client is ready! || ${new Date()}`);
});

const sendMessage = async (phone_number: string, message: string) => {
  try {
    let phone_numberNew;
    if (phone_number.startsWith("0")) {
      phone_numberNew = phone_number.substring(1);
      const chat = await clientWhatsapp.getChatById(`62${phone_numberNew}@c.us`);
      await chat.sendMessage(message);
    } else {
      phone_numberNew = phone_number;
      const chat = await clientWhatsapp.getChatById(`${phone_numberNew}@c.us`);
      await chat.sendMessage(message);
    }
  } catch (error) {
    console.log(error);
  }
};

export const sendMessageLogin = async (phone_number: string) => {
  const message = `Halo, ini adalah pesan otomatis dari aplikasi. Anda telah berhasil login.`;
  await sendMessage(phone_number, message);
};

export const sendMessageFdmTodayReport = async (
  phone_number: string,
  data_fdm: dataFdmTodayReport
) => {
  const message = `
😁 Halo, ini adalah pesan otomatis dari aplikasi FDM. 
 *Laporan FDM hari ini.*
👥 Total Karyawan : ${data_fdm.total_employee}
👤 Total Yang Mengisi : ${data_fdm.total_user}
👀 Total Yang Tidak Mengisi : ${data_fdm.total_user_not_fill}
🟢 Total Fit : ${data_fdm.total_fit}
🟡 Total Fit Follow Up : ${data_fdm.total_fit_follow_up}
🔴 Total Unfit : ${data_fdm.total_unfit}
  `;
  await sendMessage(phone_number, message);
};

export const sendMessageFdmUnfit = async (
  phone_number: string,
  data_fdm: dataFdmUnfit
) => {
  const message = `
🚨 *karyawan yang unfit hari ini.*
*${data_fdm.full_name}*
*${data_fdm.phone_number}*
*${data_fdm.department}*
`.trim();
  await sendMessage(phone_number, message);
};
