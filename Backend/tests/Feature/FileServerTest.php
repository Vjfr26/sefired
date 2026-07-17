<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class FileServerTest extends TestCase
{
    public function test_it_can_serve_existing_file_from_public_storage(): void
    {
        // Fake the configured docs disk
        $disk = config('filesystems.docs_disk');
        Storage::fake($disk);

        // Put a fake file
        $filePath = 'clientes/100526/documentos/test_doc.jpg';
        Storage::disk($disk)->put($filePath, 'fake image content');

        // Request the route
        $response = $this->get('/storage/' . $filePath);

        // Assert response
        $response->assertStatus(200);
        $this->assertEquals('fake image content', $response->streamedContent());
    }

    public function test_it_returns_404_if_file_does_not_exist(): void
    {
        $disk = config('filesystems.docs_disk');
        Storage::fake($disk);

        $response = $this->get('/storage/non_existent.jpg');

        $response->assertStatus(404);
    }

    public function test_it_prevents_directory_traversal(): void
    {
        $response = $this->get('/storage/../../etc/passwd');

        $response->assertStatus(404);
    }
}
