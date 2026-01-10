package com.shopie.backend.controller;

import com.shopie.backend.dto.ProfileUpdateRequest;
import com.shopie.backend.dto.UserResponse;
import com.shopie.backend.model.User;
import com.shopie.backend.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/users")
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Profile", description = "API de gestion du profil utilisateur")
public class ProfileController {

    @Autowired
    private UserService userService;

    @GetMapping("/profile")
    @Operation(summary = "Mon profil", description = "Récupère les informations du profil de l'utilisateur connecté")
    public ResponseEntity<UserResponse> getProfile(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        UserResponse userResponse = new UserResponse(user);
        return ResponseEntity.ok(userResponse);
    }

    @PutMapping("/profile")
    @Operation(summary = "Mettre à jour mon profil", description = "Met à jour les informations du profil de l'utilisateur connecté")
    public ResponseEntity<UserResponse> updateProfile(
            Authentication authentication,
            @Valid @RequestBody ProfileUpdateRequest request) {
        User user = (User) authentication.getPrincipal();
        UserResponse updatedUser = userService.updateProfile(user.getId(), request);
        return ResponseEntity.ok(updatedUser);
    }
}