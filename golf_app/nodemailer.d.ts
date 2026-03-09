declare module 'nodemailer' {
  const nodemailer: {
    createTransport: (options?: unknown) => {
      sendMail: (options: unknown) => Promise<unknown>;
    };
  };
  export default nodemailer;
}
