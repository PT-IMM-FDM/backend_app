import multer from "multer";
import fs from "fs";
import { formatSpacedFileName } from "../utils/format";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let dest = "public/uploads/";
    if (file.fieldname === "import_users_file") {
      dest = "public/uploads/users_file/";
    }
    if (file.fieldname === "fdm_attachment_file") {
      dest = "public/uploads/fdm_attachment_file/";
    }
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }

    cb(null, dest);
  },
  filename: function (req, file, cb) {
    const splittedOriginalName = file.originalname.split(".");
    const extension = splittedOriginalName[splittedOriginalName.length - 1];
    const formattedFileName = formatSpacedFileName(splittedOriginalName[0]);
    cb(
      null,
      `${formattedFileName}-${new Date().getTime()}.${extension}`
    );
  },
});

export const upload = multer({ storage: storage });
