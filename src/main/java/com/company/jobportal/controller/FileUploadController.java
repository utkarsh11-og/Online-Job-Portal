package com.company.jobportal.controller;

import com.company.jobportal.service.FileUploadService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@RestController
@RequestMapping("/api/files")
public class FileUploadController {

    @Autowired
    private FileUploadService fileUploadService;

    @PostMapping("/upload")
    public ResponseEntity<?> uploadFile(@RequestParam("file") MultipartFile file) {
        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "File cannot be empty"));
            }
            String fileName = fileUploadService.storeFile(file);
            String fileDownloadUri = "/api/files/" + fileName;

            return ResponseEntity.ok(Map.of(
                    "fileName", fileName,
                    "fileUrl", fileDownloadUri,
                    "size", file.getSize()
            ));
        } catch (IOException ex) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Could not upload file: " + ex.getMessage()));
        }
    }

    @GetMapping("/{fileName:.+}")
    public ResponseEntity<Resource> downloadFile(@PathVariable("fileName") String fileName) {
        Resource resource = fileUploadService.loadFileAsResource(fileName);

        String contentType = "application/octet-stream";
        if (fileName.endsWith(".pdf")) {
            contentType = "application/pdf";
        } else if (fileName.endsWith(".doc")) {
            contentType = "application/msword";
        } else if (fileName.endsWith(".docx")) {
            contentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        }

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                .body(resource);
    }
}
