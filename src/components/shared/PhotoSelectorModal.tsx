import React, { useEffect, useRef, useState } from "react";
import Modal from "./Modal";
import { UploadCloudIcon } from "lucide-react";
import Image from "next/image";
import axios from "axios";
import { imagekitIOType } from "@/data/imagekitIO";
import { clientAPI } from "@/lib/config/apiroute";

type PhotoType = imagekitIOType.Files;

let cachedPhotos: PhotoType[] | null = null;
let lastFetchTime = 0;
interface PhotoSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPhoto: (photo: PhotoType) => void;
}

const PhotoSelectorModal: React.FC<PhotoSelectorModalProps> = ({
  isOpen,
  onClose,
  onSelectPhoto,
}) => {
  const [activeTab, setActiveTab] = useState<"library" | "upload">("library");
  const [photos, setPhotos] = useState<PhotoType[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchPhotos = () => {
    setIsLoading(true);
    setError(null);
    axios
      .get(clientAPI.imagekit_io.list)
      .then((res) => {
        cachedPhotos = res.data as PhotoType[];
        lastFetchTime = Date.now();
        setPhotos(cachedPhotos);
      })
      .catch(() => {
        cachedPhotos = [];
        setPhotos([]);
        setError("Failed to load photos");
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    if (!isOpen) return;
    const shouldFetch =
      !cachedPhotos || Date.now() - lastFetchTime > 5 * 60 * 1000;
    if (shouldFetch) {
      fetchPhotos();
    } else {
      if (cachedPhotos != null) {
        setPhotos(cachedPhotos);
      }
    }
  }, [isOpen]);

  const filteredPhotos = photos.filter((photo) =>
    photo.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleUploadAndSelect = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setUploadError("Only image files are allowed");
      return;
    }
    if (file.size > 1024 * 1024) {
      setUploadError("File must be 1MB or less");
      return;
    }
    setUploadError(null);
    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await axios.post(clientAPI.imagekit_io.upload, formData);
      const newPhoto: PhotoType = res.data;
      setPhotos((prev) => {
        const updated = [newPhoto, ...prev];
        cachedPhotos = updated;
        return updated;
      });
      onSelectPhoto(newPhoto);
      onClose();
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const TabButton = ({
    tab,
    label,
  }: {
    tab: "library" | "upload";
    label: string;
  }) => (
    <button
      type="button"
      onClick={() => {
        setActiveTab(tab);
        if (tab === "upload") setUploadError(null);
      }}
      className={`px-4 py-2 text-sm font-medium rounded-t-lg ${
        activeTab === tab
          ? "bg-white text-slate-800"
          : "bg-slate-50 text-slate-500 hover:bg-slate-100"
      }`}
    >
      {label}
    </button>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Select a Photo"
      zIndex="z-60"
    >
      <div className="flex border-b border-slate-200">
        <TabButton tab="library" label="Photo Library" />
        <TabButton tab="upload" label="Upload New" />
      </div>
      <div className="bg-white ">
        {activeTab === "library" && (
          <>
            <div className="flex items-center gap-2 px-2 mb-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search photos..."
                className="flex-grow px-2 py-1 text-sm border border-slate-300 rounded"
              />
              <button
                type="button"
                onClick={fetchPhotos}
                className="px-2 py-1 text-sm text-slate-600 border border-slate-300 rounded hover:bg-slate-100"
              >
                Refresh
              </button>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 max-h-[60vh] overflow-y-auto px-2">
              {isLoading && (
                <div className="col-span-full text-center py-12 text-slate-500">
                  Loading photos...
                </div>
              )}
              {!isLoading && error && (
                <div className="col-span-full text-center py-12 text-slate-500">
                  {error}
                </div>
              )}
              {!isLoading &&
                !error &&
                filteredPhotos.map((photo) => (
                  <button
                    key={photo.fileId}
                    type="button"
                    onClick={() => {
                      onSelectPhoto(photo);
                      onClose();
                    }}
                    className="flex flex-col focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                  >
                    <div className="bg-slate-100 rounded-md overflow-hidden aspect-w-1 aspect-h-1">
                      <Image
                        width={800}
                        height={600}
                        src={photo.thumbnail}
                        alt={photo.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <p className="mt-1 text-xs text-center text-slate-700 truncate">
                      {photo.name}
                    </p>
                  </button>
                ))}
              {!isLoading && !error && filteredPhotos.length === 0 && (
                <div className="col-span-full text-center py-12 text-slate-500">
                  {searchQuery ? (
                    <p>No photos found.</p>
                  ) : (
                    <>
                      <p>No photos in the library.</p>
                      <p>Switch to the Upload New tab to add one.</p>
                    </>
                  )}
                </div>
              )}
            </div>
          </>
        )}
        {activeTab === "upload" && (
          <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-slate-300 rounded-lg h-64">
            <UploadCloudIcon className="w-16 h-16 text-slate-400 mb-4" />
            <h3 className="text-lg font-semibold text-slate-700">
              Upload a new photo
            </h3>
            <p className="text-sm text-slate-500 mb-4">
              Click the button to upload and select a new image.
            </p>
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleUploadAndSelect}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-slate-800 hover:bg-slate-700 disabled:opacity-50"
            >
              {isUploading ? "Uploading..." : "Upload Image"}
            </button>
            {uploadError && (
              <p className="text-xs text-red-500 mt-2">{uploadError}</p>
            )}

            <p className="text-xs text-slate-400 mt-2">
              Supported formats: images (max 1MB)
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default PhotoSelectorModal;
