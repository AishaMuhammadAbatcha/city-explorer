function Footer() {
  const currentYear = new Date().getFullYear().toString();
  return (
    <div
      className="px-2.5 py-8 text-center bg-[#F6F5F4] dark:bg-[#A2C8E8]"
      // sx={{
      //   padding: "10px 15px",
      //   textAlign: "center",
      //   backgroundColor: "#F6F5F4",
      //   pb: "30px",
      // }}
    >
      <p
        className="text-xs leading-3 text-[#1e1e1e]"
        // variant="body1"
        // sx={{ fontSize: "12px", lineHeight: "12px", color: "grey" }}
      >
        &copy; {currentYear} TR-ACE LTD.
      </p>
    </div>
  );
}

export default Footer;
