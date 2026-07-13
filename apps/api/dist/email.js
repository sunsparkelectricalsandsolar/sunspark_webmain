import { Socket } from "node:net";
import { connect as tlsConnect } from "node:tls";
import { env } from "./env.js";
export async function sendEmail({ to, subject, text, html }) {
    const host = env("SMTP_HOST");
    const port = Number(env("SMTP_PORT", "465"));
    const user = env("SMTP_USER");
    const pass = env("SMTP_PASSWORD");
    const from = env("SMTP_FROM", `Sunspark Electricals <${env("SUPPORT_EMAIL", "support@sunsparkelectricals.co.ke")}>`);
    if (!host || !user || !pass) {
        console.info(`[email disabled] ${subject} -> ${to}\n${text}`);
        return;
    }
    const message = buildEmailMessage({ from, to, subject, text, html });
    await sendSmtp({ host, port, user, pass, from: extractEmail(from), to, message });
}
function buildEmailMessage({ from, to, subject, text, html }) {
    const boundary = `sunspark-${Date.now().toString(36)}`;
    return [
        `From: ${from}`,
        `To: ${to}`,
        `Subject: ${subject}`,
        "MIME-Version: 1.0",
        `Content-Type: multipart/alternative; boundary="${boundary}"`,
        "",
        `--${boundary}`,
        "Content-Type: text/plain; charset=UTF-8",
        "Content-Transfer-Encoding: 8bit",
        "",
        text,
        "",
        `--${boundary}`,
        "Content-Type: text/html; charset=UTF-8",
        "Content-Transfer-Encoding: 8bit",
        "",
        html,
        "",
        `--${boundary}--`,
        ""
    ].join("\r\n");
}
async function sendSmtp(input) {
    let socket = await openSocket(input.host, input.port);
    let reader = createSmtpReader(socket);
    await reader.expect([220]);
    await command(socket, reader, `EHLO ${input.host}`, [250]);
    if (input.port !== 465) {
        await command(socket, reader, "STARTTLS", [220]);
        socket = tlsConnect({ socket, servername: input.host });
        reader = createSmtpReader(socket);
        await command(socket, reader, `EHLO ${input.host}`, [250]);
    }
    await command(socket, reader, "AUTH LOGIN", [334]);
    await command(socket, reader, Buffer.from(input.user).toString("base64"), [334]);
    await command(socket, reader, Buffer.from(input.pass).toString("base64"), [235]);
    await command(socket, reader, `MAIL FROM:<${input.from}>`, [250]);
    await command(socket, reader, `RCPT TO:<${input.to}>`, [250, 251]);
    await command(socket, reader, "DATA", [354]);
    await command(socket, reader, `${input.message.replace(/\r?\n\./g, "\r\n..")}\r\n.`, [250]);
    await command(socket, reader, "QUIT", [221]);
    socket.end();
}
function openSocket(host, port) {
    return new Promise((resolve, reject) => {
        const socket = port === 465 ? tlsConnect({ host, port, servername: host }) : new Socket().connect(port, host);
        socket.once("connect", () => resolve(socket));
        socket.once("secureConnect", () => resolve(socket));
        socket.once("error", reject);
        socket.setTimeout(20000, () => reject(new Error("SMTP connection timed out")));
    });
}
function createSmtpReader(socket) {
    let buffer = "";
    const waiters = [];
    socket.on("data", (chunk) => {
        buffer += chunk.toString("utf8");
        const lines = buffer.split(/\r?\n/);
        buffer = lines.pop() ?? "";
        for (const line of lines) {
            if (/^\d{3} /.test(line))
                waiters.shift()?.(line);
        }
    });
    return {
        expect(codes) {
            return new Promise((resolve, reject) => {
                const timer = setTimeout(() => reject(new Error("SMTP response timed out")), 20000);
                waiters.push((line) => {
                    clearTimeout(timer);
                    const code = Number(line.slice(0, 3));
                    if (!codes.includes(code))
                        reject(new Error(`SMTP command failed with ${code}`));
                    else
                        resolve(line);
                });
            });
        }
    };
}
async function command(socket, reader, line, codes) {
    socket.write(`${line}\r\n`);
    return reader.expect(codes);
}
function extractEmail(value) {
    return value.match(/<([^>]+)>/)?.[1] ?? value;
}
