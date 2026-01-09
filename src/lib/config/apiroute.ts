export const serviceAPI = {
  pocketbase: {
    company_info: "api/collections/company_info/records",
    our_service: "api/collections/services/records",
  },

  imagekitIo: {
    get_list_file: "https://api.imagekit.io/v1/files",
    upload_file: "https://upload.imagekit.io/api/v1/files/upload",
  },
};

export const clientAPI = {
  company_info: {
    get: "/api/get-company-info",
  },
  imagekit_io: {
    list: "/api/imagekit/list",
    upload: "/api/imagekit/upload",
  },
};
