package com.company.jobportal.service;

import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

public interface FileUploadService {
    String storeFile(MultipartFile file) throws IOException;
    Resource loadFileAsResource(String fileName);
}
